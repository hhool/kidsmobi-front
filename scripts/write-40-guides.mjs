/**
 * Write 40 long-tail CMS guide articles across four product categories:
 *   stroller, bicycle (Kids Bike), scooter (Kids Scooter), electric_car (Kids Ride-On).
 *
 * Mirrors scripts/write-3-guides.mjs (same schema, validation, post path).
 * Every article is advisory / criteria-based copy — no fabricated test data,
 * no "we tested" language, no medical claims (the honesty guard rejects those).
 *
 * Usage:
 *   node scripts/write-40-guides.mjs --dry-run
 *   node scripts/write-40-guides.mjs --apply
 *
 * CMS_ADMIN_ALL_TOKEN and CMS_API_BASE are read from the environment.
 */
const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const API_BASE = (process.env.CMS_API_BASE || "https://store.balancebiketoddler.com").replace(/\/+$/, "");
const TOKEN = String(process.env.CMS_ADMIN_ALL_TOKEN || "").trim();
// Generated articles go live immediately (validate gate protects quality).
const STATUS = process.env.CMS_GUIDE_STATUS || "published";

// ---------------------------------------------------------------------------
// Honesty pre-scan (matches check-honesty-claims.ts vocabulary).
// diff-review:skip-begin
const FORBIDDEN_PHRASES = [
  "we tested", "hands-on testing", "in our test group", "in our testing",
  "in our test pool", "backed by real testing", "test notes", "in our checks",
  "in our group", "in our jogging stroller field",
  "实测", "实验室", "我们的测试", "我们测试了", "检测团队",
];
// diff-review:skip-end
const FORBIDDEN_MEDICAL = [
  /\btherapeutic\b/, /\btherapy\b/, /\bcures?\b/,
  /\bdiagnos(?:e|es|ed|is|tic)\b/, /\bprescrib(?:e|es|ed)\b/,
  /recommended for children with/, /designed for autism/i, /suitable for disabilit/i,
];
const textHas = (patterns, text) => {
  const lower = String(text || "").toLowerCase();
  return patterns.some((p) => (typeof p === "string" ? lower.includes(p) : p.test(lower)));
};

// ---------------------------------------------------------------------------
// Payloads
// ---------------------------------------------------------------------------
const GUIDES = [
  {
    id: "guide-2026-stroller-airplane",
    slug: "stroller-travel-airplane",
    category: "beginner",
    taxonomy: { productCategory: "stroller", topicCategory: "beginner", topicOrder: 11 },
    seo: {
      en: {
        title: "Travel Stroller for Airplane",
        description: "What actually matters in a stroller you fold at the gate: folded size, weight, one-hand fold, and recline. How to pick one that stays with you.",
        keywords: ["travel stroller airplane", "foldable stroller for travel", "gate check stroller", "lightweight travel stroller"],
      },
      zh: {
        title: "能带上飞机的手推婴儿车怎么选",
        description: "在登机口折叠的推车，真正重要的是折叠尺寸、重量、单手收车和靠背角度。怎么挑一辆能一直陪着你的旅行车。",
        keywords: ["旅行婴儿车", "可登机推车", "轻便旅行推车", "婴儿车登机"],
      },
    },
    en: {
      title: "Travel Stroller for Airplane",
      content: `Airlines let you bring a stroller to the gate for free, but the stroller that survives a trip is not the one that looks good in the living room. This guide covers what actually matters when you need a stroller that folds small, weighs little, and still carries a tired toddler through an airport.

## Why travel changes the rules
An everyday stroller is judged on ride comfort and storage. A travel stroller is judged on two numbers: folded size and weight. Most airlines accept a stroller at the gate regardless of size, but if it does not fit in the overhead bin you will gate-check it, and gate-checked items get thrown, not carried. The stroller you can fold to under about 22 by 13 by 9 inches and lift with one hand is the one that stays with you.

## What to check before you buy
- **Folded dimensions.** Measure the folded stroller, not the open one. A stroller that folds to a flat brick beats one that folds to a long tube for bin fit.
- **Weight.** Under 15 lb is easy to carry while holding a child; under 10 lb is manageable on a shoulder.
- **One-hand fold.** You will have a child on one hip and a bag on the other. A two-hand fold at the gate is a public struggle.
- **Recline.** A near-flat recline lets a baby sleep through a delay; a rigid upright seat does not.
- **Carry strap or bag.** Gate-check without a bag means the fabric takes the abuse.

## Age and fit
For a newborn, check the recline reaches flat and the harness is a true five-point. For a toddler, a simple upright travel stroller is enough, and weight matters more than cushioning. The [newborn stroller guide](/guides/best/stroller-newborn-picks) covers flat-recline models, and the [umbrella vs full-size guide](/guides/special/stroller-umbrella-vs-full) explains where travel strollers sit on the spectrum.

## The trade you are making
A travel stroller trades suspension and storage for portability. It is the right primary stroller if you fly or take transit often, and the right second stroller if your full-size stays home. It is the wrong only stroller if you run or tackle rough paths, so see the [all-terrain guide](/guides/scenario/stroller-all-terrain).

## Safety at the airport
Always brake it before letting go on a slope, and never hang a heavy bag on the handles. A loaded handle tips a light stroller backward. The [stroller safety guide](/guides/risk/stroller-safety-tips) lists the checks that apply everywhere, not just travel.

## Further reading
- [Newborn stroller picks](/guides/best/stroller-newborn-picks)
- [Umbrella vs full-size](/guides/special/stroller-umbrella-vs-full)
- [All-terrain stroller](/guides/scenario/stroller-all-terrain)`,
    },
    zh: {
      title: "能带上飞机的手推婴儿车怎么选",
      content: `航空公司允许你免费把推车推到登机口，但能扛过一趟旅行的，往往不是客厅里最好看的那辆。这篇讲清楚：当你需要一辆能折得小、够轻、还能在机场里背着困倦幼儿的推车时，真正该看什么。

## 为什么旅行改变了标准
日常推车比的是乘坐舒适和储物；旅行推车比的是两个数字：折叠尺寸和重量。多数航空公司不管尺寸都让推车进登机口，但如果它塞不进头顶行李舱，你就得在登机口托运，而托运的行李是被扔的不是被抱的。能折到大约 22×13×9 英寸以内、单手就能拎起的车，才是那辆能一直陪着你的。

## 买前该核对的几项
- **折叠后尺寸。** 量折叠后的车，不是打开的。折成扁平砖块的比折成长筒的更好塞舱。
- **重量。** 15 磅以下，抱着孩子也能拎；10 磅以下，扛在肩上也不吃力。
- **单手收车。** 你一只手抱着孩子、另一只手拎包。在登机口两手收车是一场公开狼狈。
- **靠背角度。** 接近平躺的角度能让孩子在延误时睡着；硬邦邦的直背不行。
- **背带或收纳袋。** 没有袋就托运，布料直接承受磕碰。

## 年龄与适配
 newborn 要看靠背能否放平、安全带是否真五点式。 toddler 用简单的直背旅行车就够，重量比软垫更重要。[新生儿推车篇](/guides/best/stroller-newborn-picks)讲可放平车型，[伞车 vs 全尺寸篇](/guides/special/stroller-umbrella-vs-full)说明旅行车在光谱上的位置。

## 你做的交换
旅行车用避震和储物换便携。如果你常飞或常坐公共交通，它是合适的主力车；如果全尺寸车留在家，它是合适的第二辆。但如果你跑步或走烂路，它不该是唯一的车，见[全地形篇](/guides/scenario/stroller-all-terrain)。

## 机场里的安全
在坡道上松手前一定刹住，千万别把沉重的包挂在把手上——挂了东西的轻车会向后翻。[推车安全篇](/guides/risk/stroller-safety-tips)列了到处都该做的检查，不只是旅行。

## 延伸阅读
- [新生儿推车选购](/guides/best/stroller-newborn-picks)
- [伞车与全尺寸](/guides/special/stroller-umbrella-vs-full)
- [全地形推车](/guides/scenario/stroller-all-terrain)`,
    },
  },
  {
    id: "guide-2026-stroller-newborn",
    slug: "stroller-newborn-picks",
    category: "best",
    taxonomy: { productCategory: "stroller", topicCategory: "best", topicOrder: 11 },
    seo: {
      en: {
        title: "Newborn Stroller Picks",
        description: "A newborn needs a flat recline and a true five-point harness. What to look for in a stroller that is safe from day one, and the trade with a car seat.",
        keywords: ["newborn stroller", "stroller for newborn", "flat recline stroller", "best stroller for infant"],
      },
      zh: {
        title: "新生儿推车选购要点",
        description: "新生儿需要可放平的靠背和真五点式安全带。从出生第一天就安全的推车该看什么，以及与安全座椅之间的取舍。",
        keywords: ["新生儿推车", "婴儿推车", "可平躺推车", "婴儿车选购"],
      },
    },
    en: {
      title: "Newborn Stroller Picks",
      content: `A stroller safe for a newborn is not the same as a stroller safe for a six-month-old. The difference is one number: the recline angle. This guide covers what a newborn stroller must do, and how to choose without relying on a marketing photo of a sleeping baby.

## The one rule that matters
From birth to about six months a baby cannot hold its head up, so the seat must recline to near flat, roughly 170 degrees or more. A stroller that only sits upright is not a newborn stroller, no matter what the listing photo shows. Check the stated recline, not the picture.

## What to look for
- **Flat or near-flat recline.** Read the spec. "Multi-position" without a stated flat angle is not a promise.
- **Five-point harness.** Two shoulder, two hip, one between the legs. A three-point lap belt is not enough for a limp infant.
- **Head support.** A newborn insert or padded sides keeps a head from rolling.
- **Bassinet option.** A true bassinet clips flat and is the safest lie-flat mode for long walks.
- **Reversible seat.** Facing you lets you watch a newborn and blocks wind.

## Car seat vs stroller from birth
A travel system pairs a stroller with an infant car seat, and the seat clicks in so you move a sleeping baby without waking. The catch is the car seat is not a place to sleep for hours, and many systems are heavy. The [travel system guide](/guides/special/stroller-travel-system) weighs that choice. If you already have a car seat, a stroller with a flat recline and a bassinet may be the calmer buy.

## When a newborn stroller stops being one
Around six months, when the baby sits unaided, the flat recline matters less and portability matters more. That is the moment a [travel or umbrella stroller](/guides/beginner/stroller-travel-airplane) starts to make sense as a second or only stroller.

## Safety basics
Always use the harness, never leave a sleeping baby in a car seat on the stroller frame unattended, and check the brakes on any slope. The [stroller safety guide](/guides/risk/stroller-safety-tips) covers the checks that apply from day one.

## Further reading
- [Travel stroller for airplane](/guides/beginner/stroller-travel-airplane)
- [Travel system vs separate](/guides/special/stroller-travel-system)
- [Stroller safety tips](/guides/risk/stroller-safety-tips)`,
    },
    zh: {
      title: "新生儿推车选购要点",
      content: `对新生儿安全的推车，和对六个月大宝宝安全的推车不是一回事。区别就在一个数字：靠背角度。这篇讲新生儿推车必须做到什么，以及怎么挑，而不是信一张宝宝睡着的宣传照。

## 唯一要紧的规则
出生到大约六个月，宝宝还抬不起头，所以座椅必须能接近放平，大约 170 度或更大。只能直坐的推车不是新生儿推车，不管列表照片怎么拍。看标注的靠背角度，不是看照片。

## 该看什么
- **可放平或接近放平。** 读规格。只写"多档"却不标平躺角度，不算承诺。
- **五点式安全带。** 两点肩、两点胯、一点裆间。三点式腹带对一个瘫软的婴儿远远不够。
- **头部支撑。** 新生儿内衬或加厚侧边防止头歪。
- **睡篮选项。** 真正的睡篮能平扣，是长距离散步最安全的平躺方式。
- **可反向座椅。** 面向你能看着新生儿，也能挡风。

## 安全座椅 vs 出生即用推车
遛娃组合把推车与婴儿安全座椅配对，座椅一卡就能挪动熟睡的宝宝而不弄醒。代价是安全座椅不该连睡几小时，而且很多组合很重。[组合 vs 分开篇](/guides/special/stroller-travel-system)权衡了这个选择。如果你已有安全座椅，一辆能放平、带睡篮的推车可能是更省心的买法。

## 新生儿推车何时不再是
大约六个月、宝宝能独坐时，放平变得没那么要紧，便携变得要紧。这时[旅行或伞车](/guides/beginner/stroller-travel-airplane)作为第二辆或唯一一辆开始合理。

## 安全基础
始终用安全带；绝不要把睡在安全座椅里的宝宝连同车架单独留下；任何坡道都查刹车。[推车安全篇](/guides/risk/stroller-safety-tips)列了从第一天起就该做的检查。

## 延伸阅读
- [旅行推车选购](/guides/beginner/stroller-travel-airplane)
- [组合 vs 分开](/guides/special/stroller-travel-system)
- [推车安全要点](/guides/risk/stroller-safety-tips)`,
    },
  },
  {
    id: "guide-2026-stroller-umbrella",
    slug: "stroller-umbrella-vs-full",
    category: "special",
    taxonomy: { productCategory: "stroller", topicCategory: "special", topicOrder: 11 },
    seo: {
      en: {
        title: "Umbrella vs Full-Size Stroller",
        description: "A lightweight umbrella stroller and a full-size stroller solve different problems. When each one is the right buy, and the middle option most parents miss.",
        keywords: ["umbrella stroller vs full size", "lightweight stroller", "full size stroller", "compact stroller"],
      },
      zh: {
        title: "伞车与全尺寸推车怎么选",
        description: "轻便伞车和全尺寸推车解决的是不同的问题。各自什么时候是正确选择，以及多数父母忽略的中间选项。",
        keywords: ["伞车", "全尺寸推车", "轻便推车", "婴儿车怎么选"],
      },
    },
    en: {
      title: "Umbrella vs Full-Size Stroller",
      content: `The umbrella stroller and the full-size stroller are not rivals on a ladder. They solve different problems, and buying the wrong one means carrying the wrong tool for a year. This guide sets out when each is right.

## What each one is
A **full-size stroller** has a padded seat, a deep basket, adjustable suspension, and a reversible seat. It is the primary vehicle for daily life with a baby. An **umbrella stroller** is a lightweight, side-folding frame with a basic seat and small wheels, named for the curved handles. It is a second stroller for trips and quick errands.

## Choose full-size when
- The stroller is your main transport, not a backup.
- You walk on mixed surfaces daily and want suspension.
- You need a large basket for a diaper bag and groceries.
- You want a bassinet or flat recline for a newborn, covered in the [newborn guide](/guides/best/stroller-newborn-picks).

## Choose umbrella when
- You already own a full-size and want a travel or errand backup.
- You take transit, fly, or store the stroller in a small space.
- Your child is past the newborn stage and just needs a lift.
- Weight and fold size beat cushioning.

## The middle option parents miss
Many parents buy a full-size first, then a tiny umbrella, and feel both are wrong. The middle is a **lightweight full-feature** stroller: under 15 lb, one-hand fold, a real recline, and a decent basket. It is the only stroller some families need. The [travel stroller guide](/guides/beginner/stroller-travel-airplane) covers the light end of this middle.

## Watch the wheels
Umbrella strollers with 4 to 6 inch wheels are fine on smooth floors and sidewalks but fight you on grass and cobbles. If your routes include those, a full-size or an [all-terrain stroller](/guides/scenario/stroller-all-terrain) saves your arms.

## Further reading
- [Travel stroller for airplane](/guides/beginner/stroller-travel-airplane)
- [Newborn stroller picks](/guides/best/stroller-newborn-picks)
- [All-terrain stroller](/guides/scenario/stroller-all-terrain)`,
    },
    zh: {
      title: "伞车与全尺寸推车怎么选",
      content: `伞车和全尺寸推车不是阶梯上的对手。它们解决的是不同的问题，买错了意味着扛错工具一整年。这篇讲各自什么时候是对的。

## 各自是什么
**全尺寸推车**有软垫座椅、深储物篮、可调避震和可反向座椅，是带娃日常的主力车。**伞车**是轻便的侧向折叠车架，座椅基础、轮子小，因弯把手得名，是旅行和跑腿用的第二辆。

## 选全尺寸当
- 推车是主要出行工具而非备份。
- 每天走混合路面、想要避震。
- 需要大篮子装妈咪包和菜。
- 想要新生儿用的睡篮或平躺，见[新生儿篇](/guides/best/stroller-newborn-picks)。

## 选伞车当
- 已有全尺寸，想要旅行或跑腿备份。
- 坐公共交通、坐飞机，或空间小要收纳。
- 孩子过了新生儿期、只是需要搭一段。
- 重量和折叠尺寸比软垫更要紧。

## 父母忽略的中间选项
很多家庭先买全尺寸，再买超小伞车，结果觉得两个都不对。中间是**轻便全功能**车：15 磅以下、单手收、真靠背调节、篮子尚可。有些家庭只要这一辆。[旅行推车篇](/guides/beginner/stroller-travel-airplane)覆盖这个中间区间的轻端。

## 注意轮子
4–6 英寸小轮的伞车在平滑地面和人行道没问题，但草地和石子路上会跟你较劲。如果路线包含这些，全尺寸或[全地形推车](/guides/scenario/stroller-all-terrain)能救你的胳膊。

## 延伸阅读
- [旅行推车选购](/guides/beginner/stroller-travel-airplane)
- [新生儿推车](/guides/best/stroller-newborn-picks)
- [全地形推车](/guides/scenario/stroller-all-terrain)`,
    }
  },
  {
    id: "guide-2026-stroller-jogging",
    slug: "stroller-jogging-guide",
    category: "scenario",
    taxonomy: { productCategory: "stroller", topicCategory: "scenario", topicOrder: 11 },
    seo: {
      en: {
        title: "Jogging Stroller Buying Guide",
        description: "A jogging stroller needs fixed front wheel, air tires, and a hand brake. What to check, and why a regular stroller is not safe to run with.",
        keywords: ["jogging stroller", "running stroller", "best jogging stroller", "jogging stroller safety"],
      },
      zh: {
        title: "慢跑推车选购指南",
        description: "慢跑推车需要前轮固定、充气胎和手刹。该查什么，以及为什么普通推车跑步不安全。",
        keywords: ["慢跑推车", "跑步推车", "运动推车", "婴儿推车安全"],
      },
    },
    en: {
      title: "Jogging Stroller Buying Guide",
      content: `A jogging stroller is a three-wheeled, fixed-front-wheel stroller built to move fast with a child aboard. A regular stroller is not a safe substitute for running. This guide covers the three features that separate the two, and how to choose.

## The three non-negotiables
- **Fixed or lockable front wheel.** A swivel wheel wobbles at speed and can catch. For running, the front wheel must lock straight.
- **Air-filled tires.** Foam and solid tires transmit every bump to the child and your arms. Pneumatic tires absorb it.
- **Hand brake and wrist strap.** A brake you squeeze from behind, plus a strap around your wrist, stops a runaway on a hill.

## What else matters
- **Suspension.** At the frame or wheel, it keeps the ride smooth past a walk.
- **Recline and age.** Most jogging strollers are rated from about six months, when the baby holds its head up. Check the stated minimum age; a newborn needs a flat bassinet, not a jogger.
- **Weight.** They are heavy by design. If you lift it often, check the fold and the heft.

## When you do not need one
If you walk, not run, a full-size or [all-terrain stroller](/guides/scenario/stroller-all-terrain) with bigger wheels covers park paths without the weight. A jogger is worth it only if you actually run several times a week.

## Safety while running
Stay on smooth, even surfaces, use the wrist strap every time, and never hang a bag on the handle. The [stroller safety guide](/guides/risk/stroller-safety-tips) lists the checks that apply to every stroller. Mind the sun and the harness on longer runs.

## Further reading
- [All-terrain stroller](/guides/scenario/stroller-all-terrain)
- [Stroller safety tips](/guides/risk/stroller-safety-tips)
- [Newborn stroller picks](/guides/best/stroller-newborn-picks)`,
    },
    zh: {
      title: "慢跑推车选购指南",
      content: `慢跑推车是三轮、前轮固定的推车，为带着孩子快速移动而造。普通推车跑步并不安全。这篇讲区分两者的三个特征，以及怎么挑。

## 三项不可妥协
- **前轮固定或可锁。** 万向轮在速度下会晃，还可能卡住。跑步时前轮必须锁直。
- **充气胎。** 发泡和实心胎把每个颠簸都传给孩子的胳膊和你。充气胎能吸收。
- **手刹与腕带。** 从后面捏的刹车，加一条绕手腕的带子，能在下坡时拦住失控的车。

## 其余要紧的
- **避震。** 在车架或轮上，让超过步行的速度也平稳。
- **靠背与年龄。** 多数慢跑推车从约六个月、宝宝能抬头时起用。查标注的最低年龄；新生儿要的是平躺睡篮，不是慢跑推车。
- **重量。** 它们天生就重。常拎的话，查收车和分量。

## 你不需要它的时候
如果你走不是跑，一辆大轮子的全尺寸或[全地形推车](/guides/scenario/stroller-all-terrain)就能覆盖公园小路，不必背负重量。只有真的一周跑几次，慢跑推车才值。

## 跑步时的安全
走平滑均匀的路面，每次都用腕带，绝不在把手挂包。[推车安全篇](/guides/risk/stroller-safety-tips)列了每辆推车都该做的检查。长跑时注意防晒和安全带。

## 延伸阅读
- [全地形推车](/guides/scenario/stroller-all-terrain)
- [推车安全要点](/guides/risk/stroller-safety-tips)
- [新生儿推车](/guides/best/stroller-newborn-picks)`,
    }
  },
  {
    id: "guide-2026-stroller-double",
    slug: "stroller-double-twins",
    category: "scenario",
    taxonomy: { productCategory: "stroller", topicCategory: "scenario", topicOrder: 12 },
    seo: {
      en: {
        title: "Double Stroller for Twins",
        description: "Side-by-side or tandem: the double stroller choice comes down to doors, weight, and who rides. What to check before buying for two.",
        keywords: ["double stroller twins", "side by side stroller", "tandem stroller", "stroller for two kids"],
      },
      zh: {
        title: "双胞胎推车：并排还是前后",
        description: "并排还是前后：双人推车的选择归结为门宽、重量和谁坐。为两个孩子买前该查什么。",
        keywords: ["双胞胎推车", "并排推车", "前后推车", "双人婴儿车"],
      },
    },
    en: {
      title: "Double Stroller for Twins",
      content: `A double stroller is the only way to move two small children on foot, and the choice between side-by-side and tandem decides whether you fit through your own front door. This guide covers the trade.

## The two layouts
- **Side-by-side** seats two next to each other. Both children get the same ride and view, but the width is the problem: measure your doors, hallways, and elevator before buying.
- **Tandem (front and back)** stacks the seats. It fits through narrow spaces but is longer, heavier at the back, and the rear child gets less view and sometimes less legroom.

## What to check
- **Width vs your world.** A side-by-side is often 28 to 32 inches wide. Standard doorways are about 30 inches, so a half-inch decides your daily life.
- **Recline for both.** If one child naps while the other sits up, both seats need independent recline.
- **Weight and fold.** Doubles are heavy; check the folded size if it lives in a trunk.
- **Car seat compatibility.** For twins as newborns, check which infant seats click in, since the [newborn guide](/guides/best/stroller-newborn-picks) shows flat recline is the baseline.

## Age gap changes the answer
For twins or two under two, a true double is required. For an older toddler plus a baby, a tandem or a stroller with a standing board may do. If one child is near walking, a single plus a [lightweight stroller](/guides/special/stroller-umbrella-vs-full) as backup can beat a heavy double.

## Further reading
- [Newborn stroller picks](/guides/best/stroller-newborn-picks)
- [Umbrella vs full-size](/guides/special/stroller-umbrella-vs-full)
- [Stroller safety tips](/guides/risk/stroller-safety-tips)`,
    },
    zh: {
      title: "双胞胎推车：并排还是前后",
      content: `双人推车是步行移动两个幼儿的惟一方式，而并排与前后的选择，决定了你能否穿过自家大门。这篇讲这个取舍。

## 两种布局
- **并排**让两个孩子肩并肩。两人乘坐和视野相同，但宽度是问题：买前量好门、走廊和电梯。
- **前后（tandem）**把座位叠起来。能过窄处，但更长、后段更重，后排孩子视野更少、有时腿也局促。

## 该查什么
- **宽度 vs 你的世界。** 并排常 28–32 英寸宽。标准门约 30 英寸，半英寸就决定日常。
- **两个都能调角。** 若一个睡一个坐，两个座椅都要独立靠背调节。
- **重量与收车。** 双人车重；若放后备箱，查折叠尺寸。
- **安全座椅兼容。** 新生儿双胞胎要查哪些婴儿座椅能卡入，因为[新生儿篇](/guides/best/stroller-newborn-picks)说明平躺是底线。

## 年龄差改变答案
双胞胎或两岁内两个，必须真双人。大 toddler 加婴儿，tandem 或带站立板的推车可能够。若一个快会走，一辆单人加[轻便推车](/guides/special/stroller-umbrella-vs-full)作备份，可能胜过沉重的双人车。

## 延伸阅读
- [新生儿推车](/guides/best/stroller-newborn-picks)
- [伞车与全尺寸](/guides/special/stroller-umbrella-vs-full)
- [推车安全要点](/guides/risk/stroller-safety-tips)`,
    }
  },
  {
    id: "guide-2026-stroller-travelsystem",
    slug: "stroller-travel-system",
    category: "special",
    taxonomy: { productCategory: "stroller", topicCategory: "special", topicOrder: 12 },
    seo: {
      en: {
        title: "Travel System vs Separate",
        description: "A travel system pairs stroller and infant car seat. What you gain in convenience, and what you give up in weight and longevity, before you buy.",
        keywords: ["travel system stroller", "stroller car seat combo", "travel system vs separate", "infant car seat stroller"],
      },
      zh: {
        title: "遛娃神器组合 vs 分开买",
        description: "遛娃组合把推车与婴儿安全座椅配对。你在便利上得到什么，又在重量和寿命上失去什么，买前先看。",
        keywords: ["遛娃组合", "推车安全座椅", "组合 vs 分开", "婴儿安全座椅推车"],
      },
    },
    en: {
      title: "Travel System vs Separate",
      content: `A travel system sells one box: a stroller and an infant car seat that click together, so you move a sleeping baby from car to pavement without waking. The convenience is real, but so is the weight. This guide lays out the trade.

## What you gain
- **A sleeping baby stays asleep.** Lift the seat, click it to the frame, walk away.
- **One purchase, matched parts.** No guessing whether a seat fits a stroller.
- **A car seat base** that stays in the car while the seat travels.

## What you give up
- **Weight.** The frame is built to carry a heavy seat, so it is heavier than a stroller sold alone.
- **Longevity.** The infant seat is outgrown around the first birthday. After that the system is just a heavy stroller.
- **Choice.** You are buying two products joined, not two you each picked.

## When separate wins
If you already own an infant car seat, or you prefer a [lightweight stroller](/guides/special/stroller-umbrella-vs-full) and a separate seat, buying apart lets each item be the best fit. A newborn still needs flat recline or a bassinet on the stroller side, covered in the [newborn guide](/guides/best/stroller-newborn-picks).

## The honest middle
Many families use the system for the first year, then keep the stroller and retire the seat. If the frame is good, that works. If the frame is heavy and the child is past the seat, a lighter second stroller earns its place.

## Further reading
- [Newborn stroller picks](/guides/best/stroller-newborn-picks)
- [Umbrella vs full-size](/guides/special/stroller-umbrella-vs-full)
- [Stroller under $200](/guides/budget/stroller-under-200)`,
    },
    zh: {
      title: "遛娃神器组合 vs 分开买",
      content: `遛娃组合卖一个箱子：推车加能卡在一起的婴儿安全座椅，让你把熟睡的宝宝从车挪到路面而不弄醒。便利是真的，重量也是真的。这篇摆出这个取舍。

## 你得到什么
- **睡着的宝宝继续睡。** 拎起座椅，卡上车架，走人。
- **一次购买，零件匹配。** 不用猜座椅能不能装推车。
- **留在车里的座椅底座**，座椅随身走。

## 你失去什么
- **重量。** 车架为承载重座椅而造，比单卖的推车重。
- **寿命。** 婴儿座椅约一岁就被淘汰。之后组合只剩一辆重推车。
- **选择。** 你买的是两件连体，不是各自挑的两件。

## 什么时候分开更好
如果你已有婴儿安全座椅，或你更喜欢[轻便推车](/guides/special/stroller-umbrella-vs-full)加独立座椅，分开买能让每件都最合身。新生儿在推车侧仍需要平躺或睡篮，见[新生儿篇](/guides/best/stroller-newborn-picks)。

## 诚实的中间
很多家庭第一年用组合，之后留推车、退座椅。如果车架好，这可行。如果车架重、孩子过了座椅期，轻便的第二辆就值得。

## 延伸阅读
- [新生儿推车](/guides/best/stroller-newborn-picks)
- [伞车与全尺寸](/guides/special/stroller-umbrella-vs-full)
- [200 美元以内推车](/guides/budget/stroller-under-200)`,
    }
  },
  {
    id: "guide-2026-stroller-safety",
    slug: "stroller-safety-tips",
    category: "risk",
    taxonomy: { productCategory: "stroller", topicCategory: "risk", topicOrder: 11 },
    seo: {
      en: {
        title: "Stroller Safety Tips",
        description: "The checks that apply to every stroller: harness, brakes, tip-over, heat, and recall lookups. A two-minute routine before every walk.",
        keywords: ["stroller safety", "stroller tips", "stroller recall", "stroller tip over"],
      },
      zh: {
        title: "婴儿推车安全使用要点",
        description: "每辆推车都该做的检查：安全带、刹车、后翻、高温和召回查询。每次出门前的两分钟例行。",
        keywords: ["婴儿车安全", "推车使用技巧", "推车召回", "推车后翻"],
      },
    },
    en: {
      title: "Stroller Safety Tips",
      content: `Most stroller injuries are not crashes. They are tip-overs, falls from an unbuckled seat, and burns from a hot frame left in the sun. This guide is the two-minute routine that applies to every stroller, every walk.

## Before you walk
- **Buckle the five-point harness.** Every time, even for a short trip. A child standing in a moving stroller is the most common fall.
- **Check the brakes.** Engage and release on flat ground; a sticky brake fails when you need it on a slope.
- **Test the fold lock.** A stroller that folds on its own traps fingers and drops the child.

## Tip-over is the big one
A stroller tips backward when weight hangs on the handles. Never hang a heavy diaper bag on the back; use the basket under the seat instead. A loaded handle combined with a raised curb is the classic tip.

## Heat and burns
Metal and dark fabric in direct sun get hot enough to burn skin in minutes. Touch the frame, straps, and buckle before seating the child, and never leave a child in a parked stroller in the sun.

## Recalls
Before buying used and once a year after, look the model up. In the United States check [CPSC recalls](https://www.cpsc.gov/Recalls); in the EU check [Safety Gate](https://ec.europa.eu/safety-gate). A stroller with an open recall is not safe at any price.

## Age-stage checks
A newborn needs the harness tight and a flat recline, per the [newborn guide](/guides/best/stroller-newborn-picks). A toddler needs the same harness and a watchful eye near stairs and escalators, where strollers and children part company.

## Further reading
- [Newborn stroller picks](/guides/best/stroller-newborn-picks)
- [Travel stroller for airplane](/guides/beginner/stroller-travel-airplane)
- [All-terrain stroller](/guides/scenario/stroller-all-terrain)`,
    },
    zh: {
      title: "婴儿推车安全使用要点",
      content: `多数推车伤害不是碰撞，而是后翻、没扣好摔下来，以及晒过的烫车架烫伤。这篇是每辆推车、每次出门都该做的两分钟例行。

## 出门前
- **扣好五点式安全带。** 每次都扣，短途也是。站在移动推车里的孩子是最常见的跌落。
- **查刹车。** 在平地咬合再松开；卡住的刹车在坡道需要时偏失效。
- **试收车锁。** 自己折起来的推车夹手指、摔孩子。

## 后翻是头号风险
把手上挂重物，推车向后翻。绝不在后把挂沉的妈咪包，改用座位下的篮子。挂了东西的把手加上路缘石，是经典的后翻场景。

## 高温与烫伤
阳光下金属和深色布料几分钟就能烫到皮肤。让孩子坐前摸车架、织带和卡扣；绝不让孩子留在暴晒的停驻推车里。

## 召回
买二手前、之后每年一次，查型号。美国查 [CPSC 召回](https://www.cpsc.gov/Recalls)，欧盟查 [Safety Gate](https://ec.europa.eu/safety-gate)。有未结召回的推车，再便宜也不安全。

## 按年龄阶段
新生儿要安全带紧、靠背放平，见[新生儿篇](/guides/best/stroller-newborn-picks)。toddler 要同样的安全带，并在楼梯和扶梯附近盯紧——那里推车和孩子容易分开。

## 延伸阅读
- [新生儿推车](/guides/best/stroller-newborn-picks)
- [旅行推车选购](/guides/beginner/stroller-travel-airplane)
- [全地形推车](/guides/scenario/stroller-all-terrain)`,
    }
  },
  {
    id: "guide-2026-stroller-clean",
    slug: "stroller-how-to-clean",
    category: "maintenance",
    taxonomy: { productCategory: "stroller", topicCategory: "maintenance", topicOrder: 11 },
    seo: {
      en: {
        title: "How to Clean a Stroller",
        description: "Frame, fabric, wheels, and harness: a safe cleaning routine that will not rot the fabric or seize the wheels. What to use and what to avoid.",
        keywords: ["clean stroller", "wash stroller fabric", "stroller maintenance", "how to clean baby stroller"],
      },
      zh: {
        title: "婴儿车怎么清洗保养",
        description: "车架、布料、轮子和安全带：一套不会泡烂布料、卡死轮子的安全清洁流程。用什么、避开什么。",
        keywords: ["清洗推车", "洗婴儿车布料", "推车保养", "婴儿车怎么洗"],
      },
    },
    en: {
      title: "How to Clean a Stroller",
      content: `A stroller is wiped, spilled on, and dragged through weather for years. Cleaning it wrong rots the fabric or seizes the wheels. This guide is the routine that keeps it safe and usable.

## What to use
- **Mild soap and warm water.** Dish soap cut with water is enough for fabric and frame.
- **A soft brush** for mesh and seams where crumbs hide.
- **A toothbrush** for wheel hubs and the fold joints.
- Avoid bleach and harsh solvents; they weaken fabric and strip plastic.

## Fabric and seat
Remove the cover if it unzips. Hand wash or gentle machine cycle, then air dry. Never tumble dry, which shrinks and cracks the padding. If the cover cannot be removed, wipe with a damp cloth and a little soap, then dry with a towel.

## Frame and harness
Wipe the frame with a soapy cloth, paying attention to the joints. The five-point harness gets milky from spills; wipe it, do not soak it, and let it dry before the next walk.

## Wheels
Hair and grit wrap the axles. Pull what you can, then spin each wheel and clear the hub. A drop of light oil on a dry axle keeps it turning; do not over-oil, which gathers grit.

## Storage between seasons
Clean and dry fully before folding away. A damp fold grows mold in weeks. Store upright in a dry place, and check the brakes and fold lock when you bring it out again. The [stroller safety guide](/guides/risk/stroller-safety-tips) covers the checks worth doing then.

## Further reading
- [Stroller safety tips](/guides/risk/stroller-safety-tips)
- [All-terrain stroller](/guides/scenario/stroller-all-terrain)
- [Stroller under $200](/guides/budget/stroller-under-200)`,
    },
    zh: {
      title: "婴儿车怎么清洗保养",
      content: `推车被擦、被洒、被拖着走过几年天气。洗错了会泡烂布料或卡死轮子。这篇是让它安全又好用的流程。

## 用什么
- **温和肥皂加温水。** 餐具洗涤剂兑水，布料和车架都够。
- **软刷**刷网眼和藏碎屑的接缝。
- **旧牙刷**清轮毂和收车关节。
- 避开漂白剂和强溶剂；它们削弱布料、腐蚀塑料。

## 布料与座椅
能拉链拆就拆下。手洗或轻柔机洗，然后晾干。绝不用烘干机，会缩水开裂。拆不下的，用湿布蘸一点肥皂擦，再用毛巾擦干。

## 车架与安全带
肥皂布擦车架，关节处留意。五点安全带被洒了会变奶渍；擦别泡，下次出门前晾干。

## 轮子
毛发和泥沙缠轴。能拔就拔，再转每个轮子清轮毂。干轴滴一滴轻油保持转动；别多滴，会粘泥沙。

## 换季收纳
收起前彻底洗净晾干。湿着折，几周就长霉。竖直放在干燥处，再取出时查刹车和收车锁。[推车安全篇](/guides/risk/stroller-safety-tips)讲了那时值得做的检查。

## 延伸阅读
- [推车安全要点](/guides/risk/stroller-safety-tips)
- [全地形推车](/guides/scenario/stroller-all-terrain)
- [200 美元以内推车](/guides/budget/stroller-under-200)`,
    }
  },
  {
    id: "guide-2026-stroller-under200",
    slug: "stroller-under-200",
    category: "budget",
    taxonomy: { productCategory: "stroller", topicCategory: "budget", topicOrder: 11 },
    seo: {
      en: {
        title: "Stroller Under $200",
        description: "A useful stroller under 200 dollars is reachable. What to prioritize so the low price does not cost you in safety or a short useful life.",
        keywords: ["stroller under 200", "cheap stroller", "affordable stroller", "budget baby stroller"],
      },
      zh: {
        title: "200 美元以内的实用推车",
        description: "200 美元以内也能买到实用的推车。该优先什么，才不至于因低价在安全或使用期上付出代价。",
        keywords: ["200美元推车", "便宜推车", "平价婴儿车", "预算推车"],
      },
    },
    en: {
      title: "Stroller Under $200",
      content: `A stroller under 200 dollars can be perfectly good, or it can be a year of frustration. The price is not the problem; knowing what to skip is. This guide prioritizes the features that matter at a low budget.

## Non-negotiable at any price
- **A working five-point harness and brakes.** These are safety, not luxury. If a cheap stroller fails here, the price is too high.
- **A stable frame.** Wobble at the joints signals a stroller that will fail in months.

## What you can compromise
- **Suspension.** On smooth city sidewalks, basic wheels are fine.
- **Basket size.** A smaller basket is annoying, not dangerous.
- **Brand name.** An unknown brand with the right specs beats a famous name missing them.

## What to skip to save
- **Extra recline positions** you will never use.
- **Cup holders and parent organizers** you can add later for less.
- **A travel system** if you already own a car seat, per the [travel system guide](/guides/special/stroller-travel-system).

## Where the money shows
Under 200, the difference between a good buy and a bad one is the frame and the harness, not the color or the extras. A simple [lightweight stroller](/guides/special/stroller-umbrella-vs-full) that folds well and brakes reliably will outlast a feature-heavy bargain that rattles.

## Check before you commit
Read the stated weight limit and the recline. A stroller your child outgrows in six months was not a saving. The [newborn guide](/guides/best/stroller-newborn-picks) explains the recline rule if your child is tiny.

## Further reading
- [Travel system vs separate](/guides/special/stroller-travel-system)
- [Umbrella vs full-size](/guides/special/stroller-umbrella-vs-full)
- [Stroller safety tips](/guides/risk/stroller-safety-tips)`,
    },
    zh: {
      title: "200 美元以内的实用推车",
      content: `200 美元以内的推车可以很好用，也可能是一年的糟心。问题不在价格，而在知道该砍什么。这篇在低预算下排定要紧的功能。

## 任何价格都不可妥协
- **好用的五点安全带和刹车。** 这是安全，不是奢侈。便宜车若在这失分，价格就太贵。
- **稳的车架。** 关节晃，意味着几个月就坏。

## 可以妥协
- **避震。** 平滑城市人行道，基础轮子就行。
- **篮子大小。** 篮子小是烦，不是危险。
- **品牌。** 规格对的陌生品牌，胜过缺规格的名牌。

## 为省钱可砍
- **你永不会用的多档靠背。**
- **杯架和父母收纳**以后花更少能加。
- **遛娃组合**——若你已有安全座椅，见[组合篇](/guides/special/stroller-travel-system)。

## 钱花在哪
200 以内，好货与劣货的差别在车架和安全带，不在颜色或赠品。一辆收得好、刹车可靠的简单[轻便推车](/guides/special/stroller-umbrella-vs-full)，会比一辆花哨但哐当的便宜货更耐用。

## 下单前查
读标注的承重和靠背角度。孩子六个月就坐不下，那不算省。[新生儿篇](/guides/best/stroller-newborn-picks)讲若孩子小该守的靠背规则。

## 延伸阅读
- [组合 vs 分开](/guides/special/stroller-travel-system)
- [伞车与全尺寸](/guides/special/stroller-umbrella-vs-full)
- [推车安全要点](/guides/risk/stroller-safety-tips)`,
    }
  },
  {
    id: "guide-2026-stroller-allterrain",
    slug: "stroller-all-terrain",
    category: "scenario",
    taxonomy: { productCategory: "stroller", topicCategory: "scenario", topicOrder: 13 },
    seo: {
      en: {
        title: "All-Terrain Stroller Guide",
        description: "Grass, gravel, and cobbles need bigger wheels and suspension. What makes a stroller handle rough paths, and when a jogger is the better tool.",
        keywords: ["all terrain stroller", "stroller for grass", "rough terrain stroller", "stroller for cobblestones"],
      },
      zh: {
        title: "全地形推车怎么挑",
        description: "草地、碎石和石子路需要更大的轮子和避震。什么让推车应付烂路，以及什么时候慢跑推车是更好的工具。",
        keywords: ["全地形推车", "草地推车", "石子路推车", "越野婴儿车"],
      },
    },
    en: {
      title: "All-Terrain Stroller Guide",
      content: `A stroller that glides on a mall floor fights you on a park trail. If your routes leave the pavement, wheel size and suspension decide your sanity. This guide covers what an all-terrain stroller is, and where it stops.

## The two features that matter
- **Wheel size.** Around 8 inches or larger rolls over grass and gravel; 4 to 6 inch wheels dig in.
- **Suspension.** At the frame or wheel, it keeps the child from a shaking and you from fighting the push.

## What to expect
An all-terrain stroller is heavier and wider than a city stroller, and it folds bigger. That is the price of the wheels. If you only leave pavement once a month, a full-size with decent wheels, covered in the [umbrella vs full-size guide](/guides/special/stroller-umbrella-vs-full), may be enough.

## When a jogger is better
If your rough paths are also where you run, a [jogging stroller](/guides/scenario/stroller-jogging-guide) with a fixed front wheel and air tires beats a wanderer. The jogger trades everyday ease for true off-path control.

## Tires
Air tires grip and absorb but can puncture; foam tires never flatten but transmit bumps. For mixed use, air tires on the big wheels are the comfortable choice if you accept the odd pump.

## Safety on rough ground
Brakes matter more off pavement, where a stroller can roll. Use them on any slope and keep the harness tight. The [stroller safety guide](/guides/risk/stroller-safety-tips) lists the checks that apply everywhere.

## Further reading
- [Jogging stroller guide](/guides/scenario/stroller-jogging-guide)
- [Umbrella vs full-size](/guides/special/stroller-umbrella-vs-full)
- [Stroller safety tips](/guides/risk/stroller-safety-tips)`,
    },
    zh: {
      title: "全地形推车怎么挑",
      content: `在商场地面顺滑的推车，到了公园小道会跟你较劲。如果你的路线离开铺装路面，轮径和避震决定你的 sanity。这篇讲全地形推车是什么，以及它的边界。

## 要紧的两项
- **轮径。** 约 8 英寸或更大能碾过草地和碎石；4–6 英寸的会陷进去。
- **避震。** 在车架或轮上，让孩子不被颠、让你不被推得费劲。

## 该有预期
全地形推车比城市车重、宽，收起来也大。这是轮子的代价。如果每月只离开铺装路面一次，一辆轮子尚可的全尺寸（见[伞车 vs 全尺寸篇](/guides/special/stroller-umbrella-vs-full)）可能就够。

## 什么时候慢跑车更好
如果你的烂路同时也是你跑步的地方，一辆[慢跑推车](/guides/scenario/stroller-jogging-guide)前轮固定、充气胎，胜过漫游型。慢跑车用日常便利换真正的越野控制。

## 轮胎
充气胎抓地、吸震，但可能扎破；发泡胎永不瘪，但传颠。混合用，大轮充气胎是舒服的选择，只要你接受偶尔打气。

## 烂路上的安全
离开铺装路面，刹车更要紧——推车会滚。任何坡道都用刹车，安全带扣紧。[推车安全篇](/guides/risk/stroller-safety-tips)列了到处都该做的检查。

## 延伸阅读
- [慢跑推车指南](/guides/scenario/stroller-jogging-guide)
- [伞车与全尺寸](/guides/special/stroller-umbrella-vs-full)
- [推车安全要点](/guides/risk/stroller-safety-tips)`,
    }
  },
  {
    id: "guide-2026-bike-first-by-age",
    slug: "kids-bike-first-by-age",
    category: "beginner",
    taxonomy: { productCategory: "bicycle", topicCategory: "beginner", topicOrder: 11 },
    seo: {
      en: {
        title: "First Kids Bike by Age and Height",
        description: "A child's first real bike is decided by inseam and brake reach, not the birthday. What size, what brake, and when a balance bike still beats a pedal bike.",
        keywords: ["first kids bike", "kids bike by age", "kids bike by height", "best first bicycle for child"],
      },
      zh: {
        title: "儿童第一辆自行车：按年龄和身高选",
        description: "孩子的第一辆真自行车，由腿内长和刹车够不够得着决定，而不是生日。多大尺寸、什么刹车，以及什么时候平衡车仍然胜过脚踏车。",
        keywords: ["儿童第一辆自行车", "儿童自行车年龄", "儿童自行车身高", "小孩自行车怎么选"],
      },
    },
    en: {
      title: "First Kids Bike by Age and Height",
      content: `A child's first pedal bike is the one purchase where the birthday matters less than the inseam. This guide covers what actually decides the right first bike, why the size chart is a starting point rather than an answer, and when a balance bike is still the better first ride.

## The number that decides it
For a first bike, the seat-height range beats the wheel size. A child who can sit with both feet flat on the ground can start, stop, and balance themselves; a child on tiptoe cannot, and the bike becomes something you hold up rather than something they ride. Measure the inseam, then read the seat-height range on the listing, not the age or wheel number. The [size chart guide](/guides/beginner/kids-bike-size-chart) walks through the two-minute measurement.

## What a first bike should have
- **A brake the hands can reach.** Small hands need a lever close to the grip; a brake that needs a strong squeeze is a brake a four-year-old will not use.
- **Low standover.** The child should be able to straddle the frame with feet flat and a little clearance.
- **Light weight.** A bike heavier than about 40 percent of the rider's body weight is hard to control and impossible to pick up after a fall. Aluminum frames help here.
- **A chain guard.** Open chains pinch and dirty; a guard is the difference between a fun ride and a scraped shin.

## Pedal bike or balance bike first
If the child has never ridden anything, a [balance bike](/guides/special/kids-bike-balance-vs-training-wheels) teaches balance first and often leads to a pedal bike with no drama. If they have already mastered balance, a light pedal bike with a coaster or hand brake is the next step. The deciding factor is balance confidence, not age.

## Brakes on a first bike
Coaster brakes (pedal backward to stop) are simple and need no hand strength, but they lock the pedals, which can surprise a new rider. Hand brakes teach the habit they will use on every later bike, provided the lever is small enough. The [coaster vs hand brake guide](/guides/special/kids-bike-coaster-vs-hand-brake) covers the trade in detail. Either way, a [helmet that fits](/guides/risk/kids-bike-helmet-fit) is non-negotiable from the first push.

## When to spend more
A first bike is outgrown fast. A solid entry bike under a hundred dollars can last the two or three years of first-riding skills; see the [under-$100 guide](/guides/budget/kids-bike-under-100). Spend more when the child is keeping the bike past the beginner stage, not before.

## Further reading
- [Kids bike size chart](/guides/beginner/kids-bike-size-chart)
- [Balance bike vs training wheels](/guides/special/kids-bike-balance-vs-training-wheels)
- [Helmet fit guide](/guides/risk/kids-bike-helmet-fit)
- [Best 16 inch bike 4-6 years](/guides/best/kids-bike-best-16-inch)`,
    },
    zh: {
      title: "儿童第一辆自行车：按年龄和身高选",
      content: `孩子的第一辆脚踏车，生日的影响还不如腿内长。这篇讲真正决定第一辆车的是什么、为什么尺寸表只是起点而不是答案，以及什么时候平衡车仍然是更好的第一辆。

## 决定它的是哪个数字
对第一辆车，座高范围比轮径更关键。能双脚平坐、落地孩子才能自己起步、停下、保持平衡；踮着脚的孩子不能，车就成了你扶着而不是他骑的东西。量腿内长，然后读列表上的座高范围，而不是读年龄或轮径。[尺寸表指南](/guides/beginner/kids-bike-size-chart)讲了那两分钟怎么量。

## 第一辆车该有什么
- **手够得着的刹车。** 小手需要靠近握把的刹把；需要很大握力的刹车，四岁孩子不会用。
- **低跨高。** 孩子应该能双脚平跨车架，还留一点余量。
- **轻。** 比骑行者体重的约 40% 还重的车难控制，摔倒后也拎不起来。铝合金车架在这方面有帮助。
- **链罩。** 裸露链条会夹、会弄脏；有没有链罩，区别是一次开心的骑行和擦伤的小腿。

## 先脚踏车还是先平衡车
如果孩子从没骑过任何东西，[平衡车](/guides/special/kids-bike-balance-vs-training-wheels)先教平衡，往往能让孩子平稳过渡到脚踏车。如果已经掌握了平衡，一辆带脚刹或手刹的轻脚踏车就是下一步。决定因素是平衡信心，不是年龄。

## 第一辆车的刹车
脚刹（向后踩踏板刹车）简单、不需要手劲，但它锁住踏板，可能惊到新手。手刹教会他们以后每辆车上都用的习惯，前提是刹把足够小。脚刹与手刹的取舍见[脚刹 vs 手刹篇](/guides/special/kids-bike-coaster-vs-hand-brake)。无论哪种，[戴得合的头盔](/guides/risk/kids-bike-helmet-fit)从第一次推行起就是底线。

## 什么时候该多花
第一辆车淘汰得很快。一辆扎实的入门车不到一百美元，就能撑过最初两三年的入门技能；见[百元以内篇](/guides/budget/kids-bike-under-100)。等孩子要越过入门阶段、长期留着这辆车时，再考虑多花。

## 延伸阅读
- [儿童自行车尺寸表](/guides/beginner/kids-bike-size-chart)
- [平衡车还是辅助轮](/guides/special/kids-bike-balance-vs-training-wheels)
- [头盔佩戴指南](/guides/risk/kids-bike-helmet-fit)
- [4–6 岁最佳 16 寸车](/guides/best/kids-bike-best-16-inch)`,
    },
  },
  {
    id: "guide-2026-bike-balance-vs-training",
    slug: "kids-bike-balance-vs-training-wheels",
    category: "special",
    taxonomy: { productCategory: "bicycle", topicCategory: "special", topicOrder: 11 },
    seo: {
      en: {
        title: "Balance Bike vs Training Wheels",
        description: "Training wheels hold a child up; a balance bike teaches them to hold themselves up. What each method costs in later skills, and which fits your child.",
        keywords: ["balance bike vs training wheels", "training wheels or balance bike", "teach kid balance bike", "remove training wheels"],
      },
      zh: {
        title: "平衡车还是辅助轮：怎么选",
        description: "辅助轮把孩子撑住，平衡车教他们自己撑住自己。两种方法各在日后技能上付出什么代价，以及哪个适合你家孩子。",
        keywords: ["平衡车还是辅助轮", "辅助轮还是平衡车", "平衡车教学", "拆辅助轮"],
      },
    },
    en: {
      title: "Balance Bike vs Training Wheels",
      content: `Training wheels and balance bikes both get a child rolling, but they teach opposite things. This guide covers what each method actually builds, what it delays, and how to pick between them for your child.

## What training wheels do
Training wheels hold the bike upright so a child can pedal without falling. That is genuinely useful for building pedal confidence, but it also lets the child ignore balance entirely. The bike leans on the wheels, not on the rider's body, so the core skill of a bicycle — staying up by steering — is never practiced.

## What a balance bike does
A balance bike has no pedals. The child walks, then glides, learning to keep upright by shifting weight and steering. By the time they move to a pedal bike, balance is already solved, and many skip training wheels altogether. The trade is that a balance bike is a separate purchase before the pedal bike.

## The real cost of each
- **Training wheels:** fast pedal confidence, slow balance. Transitioning off them later often means a few weeks of wobble while the child relearns balance they skipped.
- **Balance bike:** slower to a pedal bike, faster once there. The child arrives at the pedal bike already able to balance, so the only new skill is pedaling.

## Which fits your child
- If the child is under about four and you want one bike to do both jobs, a [first pedal bike](/guides/beginner/kids-bike-first-by-age) with a low seat and a removable set of training wheels is a common path.
- If you can buy two stages, a balance bike first, then a light pedal bike, is the smoother route and avoids the wobble window.
- If the child is already pedaling on training wheels, the [teach-to-ride guide](/guides/scenario/kids-bike-teach-to-ride) covers coming off them.

## What does not change
Whichever you choose, fit still rules: the [size chart](/guides/beginner/kids-bike-size-chart) decides the bike, and a [helmet](/guides/risk/kids-bike-helmet-fit) is required from the first roll. Neither method makes protective gear optional.

## Further reading
- [First kids bike by age and height](/guides/beginner/kids-bike-first-by-age)
- [Kids bike size chart](/guides/beginner/kids-bike-size-chart)
- [Teach a kid to ride](/guides/scenario/kids-bike-teach-to-ride)`,
    },
    zh: {
      title: "平衡车还是辅助轮：怎么选",
      content: `辅助轮和平衡车都能让孩子动起来，但教的恰恰是相反的事。这篇讲每种方法真正练出什么、又推迟了什么，以及怎么为你的孩子选。

## 辅助轮做了什么
辅助轮把车撑住，让孩子不用摔倒就能踩踏板。这对建立踩踏信心确实有用，但也让孩子完全忽略平衡。车靠轮子立着，不靠身体，所以自行车的核心技能——靠转向保持不倒——从来没被练过。

## 平衡车做了什么
平衡车没有踏板。孩子先走，再滑，学会靠移动重心和转向保持直立。等他们换到脚踏车，平衡已经解决，很多人直接跳过辅助轮。代价是平衡车是脚踏车前的一笔单独开销。

## 各自的真实代价
- **辅助轮：** 踩踏信心快，平衡慢。日后拆掉它们，往往要几周的摇晃，因为孩子要补学被跳过的平衡。
- **平衡车：** 上脚踏车慢，上去之后快。孩子到脚踏车时已经会平衡，唯一要学的新技能是踩踏板。

## 哪个适合你家孩子
- 如果孩子不到四岁、你想一辆车兼顾两件事，一辆[入门脚踏车](/guides/beginner/kids-bike-first-by-age)配低座高和可拆辅助轮，是常见路径。
- 如果能买两个阶段，先平衡车、再轻脚踏车，是更顺的路，也避开摇晃窗口。
- 如果孩子已经在辅助轮上踩了，[学骑车篇](/guides/scenario/kids-bike-teach-to-ride)讲怎么拆掉它们。

## 不变的事
不管选哪种，合身仍是铁律：[尺寸表](/guides/beginner/kids-bike-size-chart)决定车，[头盔](/guides/risk/kids-bike-helmet-fit)从第一次滚动起就必需。哪种方法都不让护具变成可选。

## 延伸阅读
- [儿童第一辆自行车](/guides/beginner/kids-bike-first-by-age)
- [儿童自行车尺寸表](/guides/beginner/kids-bike-size-chart)
- [教小孩骑车](/guides/scenario/kids-bike-teach-to-ride)`,
    },
  },
  {
    id: "guide-2026-bike-size-chart",
    slug: "kids-bike-size-chart",
    category: "beginner",
    taxonomy: { productCategory: "bicycle", topicCategory: "beginner", topicOrder: 12 },
    seo: {
      en: {
        title: "Kids Bike Size Chart by Age",
        description: "Wheel size is a rough shortcut; inseam is the real fit. A practical chart from 12 to 24 inch wheels, and how to read a seat-height range before you buy.",
        keywords: ["kids bike size chart", "kids bike by wheel size", "12 inch kids bike age", "16 inch bike age"],
      },
      zh: {
        title: "儿童自行车尺寸表：按年龄",
        description: "轮径只是粗略捷径，腿内长才是真合身。从 12 到 24 寸轮的实用对照，以及买前怎么读座高范围。",
        keywords: ["儿童自行车尺寸", "儿童车轮径", "12寸儿童车年龄", "16寸车年龄"],
      },
    },
    en: {
      title: "Kids Bike Size Chart by Age",
      content: `Wheel size sells bikes, but it is a shortcut, not a fit. This guide gives a practical chart and explains why the seat-height range — not the wheel number or the age — is what you should read before buying.

## Read this first
Two children of the same age can need different wheel sizes because their inseams differ. Measure the inseam (feet flat, measure crotch to floor), then match it to the seat-height range. A bike fits if the minimum seat height is at or just below the inseam and the maximum leaves room to grow. The [first bike guide](/guides/beginner/kids-bike-first-by-age) shows why this beats the birthday.

## Wheel size by age (rough)
- **12 inch:** roughly ages 2-4, inseam about 14-17 inches. Starter bikes, often with training wheels or as balance bikes.
- **14 inch:** roughly ages 3-5, inseam about 16-20 inches.
- **16 inch:** roughly ages 4-6, inseam about 18-22 inches. The most common first pedal size — see [best 16 inch picks](/guides/best/kids-bike-best-16-inch).
- **20 inch:** roughly ages 6-9, inseam about 22-25 inches. The bridge to bigger bikes — see [best 20 inch picks](/guides/best/kids-bike-best-20-inch).
- **24 inch:** roughly ages 8-12, inseam about 24-28 inches. Near-adult geometry without the adult size.

## Why the range matters more than the number
A 16 inch bike with a low minimum seat height fits a small four-year-old; the same wheel size with a high minimum fits a tall six-year-old. The wheel size tells you the ballpark; the seat-height range tells you whether your child is in it. Always check the range on the listing.

## Brakes scale with size
Smaller bikes lean on coaster brakes; from 20 inch up, hand brakes become standard and are worth learning early. The [coaster vs hand brake guide](/guides/special/kids-bike-coaster-vs-hand-brake) covers the choice. Whichever, a [helmet](/guides/risk/kids-bike-helmet-fit) must fit before the first ride.

## Don't buy to grow into
A bike a child cannot touch the ground on is unsafe, not future-proof. It is cheaper to size correctly and replace in two years than to own a bike they cannot ride now.

## Further reading
- [First kids bike by age and height](/guides/beginner/kids-bike-first-by-age)
- [Best 16 inch bike 4-6 years](/guides/best/kids-bike-best-16-inch)
- [Best 20 inch bike 7-9 years](/guides/best/kids-bike-best-20-inch)
- [Helmet fit guide](/guides/risk/kids-bike-helmet-fit)`,
    },
    zh: {
      title: "儿童自行车尺寸表：按年龄",
      content: `轮径用来卖车，但它是捷径，不是合身。这篇给一张实用对照，并解释为什么买前该读的是座高范围——而不是轮径数字或年龄。

## 先读这段
同年龄的两个孩子可能因为腿内长不同，需要不同轮径。量腿内长（脚平放，量胯到地），再把它对到座高范围。座高最小值等于或略低于腿内长、最大值还留生长空间，就是合身。[第一辆车指南](/guides/beginner/kids-bike-first-by-age)讲清楚为什么这胜过生日。

## 按年龄的轮径（粗略）
- **12 寸：** 约 2–4 岁，腿内长约 14–17 英寸。入门车，常带辅助轮或本身就是平衡车。
- **14 寸：** 约 3–5 岁，腿内长约 16–20 英寸。
- **16 寸：** 约 4–6 岁，腿内长约 18–22 英寸。最常见的第一辆脚踏车尺寸——见[16 寸精选](/guides/best/kids-bike-best-16-inch)。
- **20 寸：** 约 6–9 岁，腿内长约 22–25 英寸。通往更大尺寸的桥——见[20 寸精选](/guides/best/kids-bike-best-20-inch)。
- **24 寸：** 约 8–12 岁，腿内长约 24–28 英寸。接近成人几何，但还没到成人尺寸。

## 为什么范围比数字更重要
一辆座高最低点很低的 16 寸车，合身一个偏小的四岁孩子；同轮径但最低点很高的，合身一个高个六岁。轮径告诉你大致区间，座高范围告诉你孩子是否在区间里。务必核对列表上的范围。

## 刹车随尺寸变化
小车多靠脚刹；从 20 寸起，手刹成为标配，也值得早学。[脚刹 vs 手刹篇](/guides/special/kids-bike-coaster-vs-hand-brake)讲这个选择。无论哪种，[头盔](/guides/risk/kids-bike-helmet-fit)必须在第一次骑行前就合身。

## 别买"等长大"的
孩子脚够不到地的车不安全，不是为未来省。宁可尺寸正确、两年后换，也不要有一辆现在骑不了的车。

## 延伸阅读
- [儿童第一辆自行车](/guides/beginner/kids-bike-first-by-age)
- [4–6 岁最佳 16 寸车](/guides/best/kids-bike-best-16-inch)
- [7–9 岁最佳 20 寸车](/guides/best/kids-bike-best-20-inch)
- [头盔佩戴指南](/guides/risk/kids-bike-helmet-fit)`,
    },
  },
  {
    id: "guide-2026-bike-best-16",
    slug: "kids-bike-best-16-inch",
    category: "best",
    taxonomy: { productCategory: "bicycle", topicCategory: "best", topicOrder: 11 },
    seo: {
      en: {
        title: "Best 16 Inch Bike for 4-6 Years",
        description: "The 16 inch bike is the classic first pedal size. What to check: weight, brake type, and a seat range that fits a four-year-old, not just a six-year-old.",
        keywords: ["best 16 inch kids bike", "16 inch bike 4 year old", "16 inch bike 5 year old", "lightweight 16 inch bike"],
      },
      zh: {
        title: "4–6 岁最佳 16 寸儿童自行车",
        description: "16 寸是经典的第一辆脚踏车尺寸。该看什么：重量、刹车类型，以及一座高范围合身四岁而不是只合身六岁的孩子。",
        keywords: ["最佳16寸儿童车", "16寸4岁自行车", "16寸5岁自行车", "轻便16寸车"],
      },
    },
    en: {
      title: "Best 16 Inch Bike for 4-6 Years",
      content: `The 16 inch bike is where most children get their first real pedals. This guide covers the few criteria that separate a good 16 inch bike from a frustrating one, and why the catalog photo is the last thing to trust.

## Weight is the first filter
A 16 inch bike that weighs as much as the child is a bike they cannot control or pick up. Look for something around 15-20 lb; aluminum frames and basic components keep weight down. Anything over about 25 lb is worth passing on for a first rider.

## Brake: coaster, hand, or both
At this size, coaster brakes are common and need no hand strength, but they lock the pedals. Hand brakes on small levers teach the habit they will keep, but only if the lever is reach-adjustable. The [coaster vs hand brake guide](/guides/special/kids-bike-coaster-vs-hand-brake) explains the trade. A bike with both gives a child time to learn the hand brake while the coaster backs them up.

## Seat range beats the wheel number
Check the seat-height range, not just "16 inch." A low minimum lets a small four-year-old start; a high maximum lets a six-year-old keep it. A bike whose minimum seat is above the child's inseam is the wrong bike regardless of the wheel. Match it on the [size chart](/guides/beginner/kids-bike-size-chart).

## Details that matter at this age
- **Chain guard:** keeps pants and shins clean and unpinched.
- **Wide-ish tires:** roll over cracks and curbs a skinny tire would catch.
- **Tool-free seat clamp:** adjustments happen often as they grow.

## What to skip
Heavy steel BMX-style bikes with no guards, and anything whose only stated spec is a cartoon character. The character does not help the child ride. A [helmet](/guides/risk/kids-bike-helmet-fit) is still required, and the bike should fit before you add one.

## Under budget
If price leads the decision, the [under-$100 guide](/guides/budget/kids-bike-under-100) lists what a cheaper 16 inch bike should still include.

## Further reading
- [Kids bike size chart](/guides/beginner/kids-bike-size-chart)
- [Coaster vs hand brake](/guides/special/kids-bike-coaster-vs-hand-brake)
- [Helmet fit guide](/guides/risk/kids-bike-helmet-fit)
- [Best 20 inch bike 7-9 years](/guides/best/kids-bike-best-20-inch)`,
    },
    zh: {
      title: "4–6 岁最佳 16 寸儿童自行车",
     content: `16 寸是大多数孩子拿到第一对真踏板的地方。这篇讲区分一辆好 16 寸车和一辆让人沮丧的车的几个标准，以及为什么目录照片最不该信。

## 重量是第一个筛子
一辆和孩子一样重的 16 寸车，是他们控制不了也拎不起的车。找约 15–20 磅的；铝合金车架和基础部件能把重量压下来。对第一任骑行者，超过约 25 磅的都该放过。

## 刹车：脚刹、手刹，还是都要
这个尺寸脚刹常见、不需要手劲，但会锁踏板。小手刹把教的是他们会一直保持的习惯，前提是刹把可调行程。[脚刹 vs 手刹篇](/guides/special/kids-bike-coaster-vs-hand-brake)讲这个取舍。一辆两者都有的车，给孩子时间学手刹，同时脚刹兜底。

## 座高范围胜过轮径数字
看座高范围，不只是"16 寸"。最低点低，让偏小的四岁能起步；最高点高，让六岁能留着。最低座高高于孩子腿内长的车，无论轮子多大都是错的车。在[尺寸表](/guides/beginner/kids-bike-size-chart)上核对。

## 这个年龄要紧的细节
- **链罩：** 让裤子和腿干净、不被夹。
- **偏宽的胎：** 碾过裂缝和路缘，窄胎会卡住。
- **免工具座管夹：** 他们长高时要经常调。

## 该跳过什么
没有链罩的重型钢制 BMX 风格车，以及唯一标榜是卡通角色的车。角色帮不了孩子骑行。还是要有[头盔](/guides/risk/kids-bike-helmet-fit)，而且车要先合身再加它。

## 预算内
如果价格主导决策，[百元以内篇](/guides/budget/kids-bike-under-100)列了便宜 16 寸车仍该有的东西。

## 延伸阅读
- [儿童自行车尺寸表](/guides/beginner/kids-bike-size-chart)
- [脚刹还是手刹](/guides/special/kids-bike-coaster-vs-hand-brake)
- [头盔佩戴指南](/guides/risk/kids-bike-helmet-fit)
- [7–9 岁最佳 20 寸车](/guides/best/kids-bike-best-20-inch)`,
    },
  },
  {
    id: "guide-2026-bike-best-20",
    slug: "kids-bike-best-20-inch",
    category: "best",
    taxonomy: { productCategory: "bicycle", topicCategory: "best", topicOrder: 12 },
    seo: {
      en: {
        title: "Best 20 Inch Bike for 7-9 Years",
        description: "At 20 inch, hand brakes and gears start to matter. What to check for a school-run rider: brake feel, weight, and a frame that fits before the growth spurt.",
        keywords: ["best 20 inch kids bike", "20 inch bike 7 year old", "20 inch bike 8 year old", "20 inch bike with gears"],
      },
      zh: {
        title: "7–9 岁最佳 20 寸儿童自行车",
        description: "到 20 寸，手刹和变速开始要紧。给一个自信的通勤小骑手该查什么：刹车手感、重量，以及一辆在猛长期前就合身的车架。",
        keywords: ["最佳20寸儿童车", "20寸7岁自行车", "20寸8岁自行车", "带变速20寸车"],
      },
    },
    en: {
      title: "Best 20 Inch Bike for 7-9 Years",
      content: `The 20 inch bike is the workhorse of the school-run years. This guide covers what changes at this size — hand brakes, sometimes gears — and how to pick a bike a seven-to-nine-year-old will actually ride every day.

## Hand brakes become the norm
At 20 inch, hand brakes are standard and coasters fade. A good lever reaches small hands and modulates rather than snapping shut. Test that the child can pull the lever to the bar without a white-knuckle squeeze. The [coaster vs hand brake guide](/guides/special/kids-bike-coaster-vs-hand-brake) covers what to expect if a coaster is still fitted.

## Gears: nice, not required
Many 20 inch bikes add a single-speed-plus or a few gears. Gears help on hills and longer rides but add weight and maintenance. For flat neighborhood riding, a clean single speed is fine; for hilly commutes, a few gears earn their keep. The [chain and tire care guide](/guides/maintenance/kids-bike-chain-tire-care) covers what gears add to upkeep.

## Weight still rules
A lighter bike is easier to ride to school and lift onto a rack. Aim for the lightest bike that still has real brakes and a usable seat range; heavy "trick" frames tire a child fast.

## Fit before the growth spurt
Seven-to-nine is exactly when children shoot up. Check the seat-height maximum and the standover: there should be room to grow into the bike over a year or two, not a bike they will outgrow in six months. Use the [size chart](/guides/beginner/kids-bike-size-chart) to place them in the 20 inch window.

## Safety basics
A [helmet that fits](/guides/risk/kids-bike-helmet-fit) is mandatory for independent riders, and hand brakes mean teaching the child to brake before every ride, not after. Reflectors and a bell are worth adding for road-side visibility.

## Further reading
- [Kids bike size chart](/guides/beginner/kids-bike-size-chart)
- [Coaster vs hand brake](/guides/special/kids-bike-coaster-vs-hand-brake)
- [Chain and tire care](/guides/maintenance/kids-bike-chain-tire-care)
- [Helmet fit guide](/guides/risk/kids-bike-helmet-fit)`,
    },
    zh: {
      title: "7–9 岁最佳 20 寸儿童自行车",
      content: `20 寸是上学通勤岁月的主力。这篇讲这个尺寸有什么变化——手刹、有时变速——以及怎么挑一辆七到九岁孩子每天真会骑的车。

## 手刹成为常态
到 20 寸，手刹是标配，脚刹退场。好的刹把够得到小手，且能渐进制动而不是猛地锁死。确认孩子能把刹把拉到车把，而不用攥得发白。[脚刹 vs 手刹篇](/guides/special/kids-bike-coaster-vs-hand-brake)讲如果还装了脚刹该期待什么。

## 变速：加分，非必需
很多 20 寸车加了单速以上或几档变速。变速在坡和多程骑行上有帮助，但增加重量和养护。平路社区骑行，干净的单速就够了；坡多的通勤，几档变速值回票价。[链条与轮胎养护篇](/guides/maintenance/kids-bike-chain-tire-care)讲变速多出来的维护。

## 重量仍主导
更轻的车更容易骑去学校、更容易搬上架。在仍有真刹车和可用座高范围的前提下，挑最轻的；重型"特技"车架很快让孩子累垮。

## 猛长期前先合身
七到九岁正是蹿个的时候。核对座高上限和跨高：要有一年左右长进去的空间，而不是六个月就淘汰的车。用[尺寸表](/guides/beginner/kids-bike-size-chart)把他们放进 20 寸窗口。

## 安全基础
[合身头盔](/guides/risk/kids-bike-helmet-fit)对独立骑行者强制；手刹意味着每次骑行前就教孩子刹车，而不是之后。反光片和铃铛值得加，为路边可见性。

## 延伸阅读
- [儿童自行车尺寸表](/guides/beginner/kids-bike-size-chart)
- [脚刹还是手刹](/guides/special/kids-bike-coaster-vs-hand-brake)
- [链条与轮胎养护](/guides/maintenance/kids-bike-chain-tire-care)
- [头盔佩戴指南](/guides/risk/kids-bike-helmet-fit)`,
    },
  },
  {
    id: "guide-2026-bike-helmet",
    slug: "kids-bike-helmet-fit",
    category: "risk",
    taxonomy: { productCategory: "bicycle", topicCategory: "risk", topicOrder: 11 },
    seo: {
      en: {
        title: "Kids Bike Helmet Fit Guide",
        description: "A helmet only works if it fits. The two-finger test for straps and the eye-level rule for position, plus when to retire a helmet after a hit.",
        keywords: ["kids bike helmet fit", "how to fit child bike helmet", "bike helmet too big child", "when replace kids helmet"],
      },
      zh: {
        title: "儿童自行车头盔怎么戴才安全",
        description: "头盔只有戴合身才管用。织带的两指测试和位置的水平线规则，以及撞过之后何时退役头盔。",
        keywords: ["儿童自行车头盔", "头盔怎么戴", "儿童头盔太大", "头盔何时换"],
      },
    },
    en: {
      title: "Kids Bike Helmet Fit Guide",
      content: `A helmet that fits is the single most effective thing you can put on a child on a bike. This guide covers the fit checks anyone can do in two minutes, and the mistake that makes a helmet useless.

## Position: level, not back
The helmet should sit level on the head, low on the forehead — the front edge about two finger-widths above the eyebrows. The most common error is pushing it back like a hat, which leaves the forehead exposed exactly where a fall hits first.

## The strap test
Buckle and tighten until the straps form a clean Y just under each ear, with no slack. A correctly tightened strap lets you fit no more than one or two fingers between strap and chin, and the helmet should not rock more than an inch when you push it front-to-back.

## The eye-level rule
Ask the child to look up. They should see the front rim of the helmet. If they cannot, it is too high on the head and will not protect the forehead.

## Fit to the head, not the age
Helmets are sized by head circumference, not age. Measure around the widest part of the head and match the label. A helmet that rocks or slides is the wrong size, even if the box said the right age.

## After a crash
A helmet that has absorbed one impact has done its job and should be replaced, even if there is no visible crack. The foam compresses once; it does not reset. This is true for every helmet, cheap or expensive.

## When to move on
Children outgrow helmets faster than they outgrow bikes. Re-measure every season; a helmet that sat level last spring may now ride up. The [first bike guide](/guides/beginner/kids-bike-first-by-age) assumes a fitted helmet from the first ride, and so should every ride after.

## Further reading
- [First kids bike by age and height](/guides/beginner/kids-bike-first-by-age)
- [Kids bike size chart](/guides/beginner/kids-bike-size-chart)`,
    },
    zh: {
      title: "儿童自行车头盔怎么戴才安全",
      content: `一顶戴合头的盔，是你能给骑车孩子上的最有效的一件事。这篇讲任何人两分钟能做的贴合检查，以及让头盔失效的那个常见错误。

## 位置：水平，不后仰
头盔应水平戴在头上、压低在前额——前缘约在眉毛上方两指宽。最常见的错误是像帽子一样往后推，把前额露在正好最先着地的位置。

## 织带测试
扣好并收紧，让织带在每个耳朵正下方形成干净的 Y，没有松弛。正确收紧的织带，你和织带与下巴之间最多能塞一两根手指；前后推头盔，不应晃动超过一英寸。

## 平视规则
让孩子抬头看。他们应该能看到头盔前缘。如果看不到，说明戴得太高，护不住前额。

## 按头围，不按年龄
头盔按头围分码，不按年龄。绕头部最宽处量一圈，对上标签。会晃动或滑动的盔是错码，哪怕盒子写了正确的年龄。

## 撞过之后
吸收过一次冲击的盔已经完成使命，应更换，即使没有可见裂缝。泡沫只压缩一次，不会复位。便宜或昂贵的盔都一样。

## 何时换大
孩子长过头盔比长过自行车快。每季重测；去年春天还水平的盔，现在可能上移。[第一辆车指南](/guides/beginner/kids-bike-first-by-age)假定从第一次骑行起就有合身头盔，之后的每次骑行也该如此。

## 延伸阅读
- [儿童第一辆自行车](/guides/beginner/kids-bike-first-by-age)
- [儿童自行车尺寸表](/guides/beginner/kids-bike-size-chart)`,
    },
  },
  {
    id: "guide-2026-bike-under-100",
    slug: "kids-bike-under-100",
    category: "budget",
    taxonomy: { productCategory: "bicycle", topicCategory: "budget", topicOrder: 11 },
    seo: {
      en: {
        title: "Best Kids Bike Under $100",
        description: "A cheap first bike can still be safe and ridable. The few non-negotiable specs under $100: weight, brakes, chain guard, and a real seat range.",
        keywords: ["kids bike under 100", "cheap kids bike", "best budget kids bike", "affordable 16 inch bike"],
      },
      zh: {
        title: "100 美元以内耐用的儿童自行车",
        description: "便宜的入门车也可以安全、好骑。百元以内不能妥协的几点：重量、刹车、链罩，以及真实的座高范围。",
        keywords: ["百元儿童自行车", "便宜儿童车", "性价比儿童车", "平价16寸车"],
      },
    },
    en: {
      title: "Best Kids Bike Under $100",
      content: `A low budget does not have to mean an unsafe bike. This guide covers the specs a sub-$100 kids bike must still have, and the corners that are not worth cutting.

## What to insist on at any price
- **Brakes that work.** A coaster or a small hand brake the child can actually pull. A bike with no working brake is not a bargain.
- **A chain guard.** Non-negotiable; open chains pinch and dirty at every price point.
- **A real seat-height range.** Check it on the listing. A bike that fits beats a bike that is cheap but too big.
- **Light enough to lift.** Under about 25 lb for a small rider.

## Where cheap bikes cut corners
Budget bikes often use heavier steel frames, crude bearings, and grips that rotate. None of these are safety failures by themselves, but they make the bike harder to ride and quicker to abandon. Look for the lightest option in your size window rather than the heaviest "feature" bike.

## 16 inch is the sweet spot
The [best 16 inch guide](/guides/best/kids-bike-best-16-inch) lists what a first pedal bike needs; most sub-$100 winners are 16 inch because that is where simple, light designs are easiest to make. A 20 inch bike under $100 exists but is usually heavier — see the [best 20 inch guide](/guides/best/kids-bike-best-20-inch).

## Skip the licensed character bikes
Cartoon-branded bikes at this price are almost always the heaviest and least adjustable. The character does nothing for riding and everything for the price.

## Safety is not budget-dependent
A [helmet](/guides/risk/kids-bike-helmet-fit) is required at every price, and a correctly sized bike matters more than the sticker. Spend the savings on a good helmet rather than a heavier frame.

## Further reading
- [Best 16 inch bike 4-6 years](/guides/best/kids-bike-best-16-inch)
- [Best 20 inch bike 7-9 years](/guides/best/kids-bike-best-20-inch)
- [Helmet fit guide](/guides/risk/kids-bike-helmet-fit)`,
    },
    zh: {
      title: "100 美元以内耐用的儿童自行车",
      content: `低预算不必等于不安全的车。这篇讲百元以内的儿童车仍必须有的规格，以及哪些省法不值得。

## 任何价位都要坚持的
- **能用的刹车。** 孩子真能拉的脚刹或小手刹。没有可用刹车的车不是便宜货。
- **链罩。** 没得商量；在任何价位，裸露链条都夹人、弄脏。
- **真实的座高范围。** 在列表上核对。合身的车胜过便宜但太大的车。
- **轻到能拎。** 小骑手约 25 磅以内。

## 便宜车在哪里偷工
预算车常用更重的钢架、粗糙的轴承和会转的握把。这些本身都不是安全故障，但让车更难骑、更快被弃。在你的尺寸窗口里挑最轻的，而不是最重最"花哨"的。

## 16 寸是甜点
[16 寸精选](/guides/best/kids-bike-best-16-inch)列了第一辆脚踏车需要的；百元以内的赢家多是 16 寸，因为简单轻量设计在这里最好做。百元内的 20 寸车存在但通常更重——见[20 寸精选](/guides/best/kids-bike-best-20-inch)。

## 跳过授权角色车
这个价位的卡通品牌车几乎总是最重、最不可调。角色对骑行毫无帮助，对价格帮助巨大。

## 安全不随预算变
[头盔](/guides/risk/kids-bike-helmet-fit)在任何价位都必需，尺寸正确的车比标价更紧要。把省下的钱花在一顶好头盔上，而不是更重的车架。

## 延伸阅读
- [4–6 岁最佳 16 寸车](/guides/best/kids-bike-best-16-inch)
- [7–9 岁最佳 20 寸车](/guides/best/kids-bike-best-20-inch)
- [头盔佩戴指南](/guides/risk/kids-bike-helmet-fit)`,
    },
  },
  {
    id: "guide-2026-bike-teach-ride",
    slug: "kids-bike-teach-to-ride",
    category: "scenario",
    taxonomy: { productCategory: "bicycle", topicCategory: "scenario", topicOrder: 11 },
    seo: {
      en: {
        title: "Teach a Kid to Ride a Bike",
        description: "The fastest way off training wheels is to lower the seat and pull the pedals. A calm path from balance to pedaling, with a helmet on the whole time.",
        keywords: ["teach kid ride bike", "take off training wheels", "teach balance bike to pedal", "kid learn ride bicycle"],
      },
      zh: {
        title: "怎么教小孩骑自行车（不用辅助轮）",
        description: "最快拆掉辅助轮的办法是先放低座、先拆踏板。从平衡到踩踏的冷静分步法，全程戴着头盔。",
        keywords: ["教小孩骑车", "拆辅助轮", "平衡车转脚踏", "小孩学自行车"],
      },
    },
    en: {
      title: "Teach a Kid to Ride a Bike",
      content: `The old method — hold the seat and run — works, but the calmer path is to teach balance before pedaling. This guide covers a step-by-step approach most children master in a session or two, and what to do about training wheels if they are already on.

## Lower the seat first
Drop the seat so the child can put both feet flat on the ground while seated. Flat feet are what let them balance without fear. This single change fixes most "I can't" moments.

## Step 1: walk, then glide
With pedals on or off, have the child walk the bike, then lift feet and glide short distances. They learn that balance comes from moving, not from you holding on. A [balance bike](/guides/special/kids-bike-balance-vs-training-wheels) has already taught this; a pedal bike can do the same with the pedals removed for a day.

## Step 2: add pedaling last
Once they glide confidently, put the pedals back and have them start with one push, then pedal. Keep the seat low so they can still touch down. Within a session or two, raise the seat to the proper height from the [size chart](/guides/beginner/kids-bike-size-chart).

## If training wheels are already on
Loosen them so they barely touch, then remove one, then both, over a few rides. Each step forces a little more balance. The [balance vs training wheels guide](/guides/special/kids-bike-balance-vs-training-wheels) explains why this is worth the short wobble.

## Keep it short and calm
Ten minutes of success beats an hour of frustration. Stop while they are winning. The [helmet](/guides/risk/kids-bike-helmet-fit) stays on the entire time, and a flat, open space away from traffic is the only place to start.

## Further reading
- [Balance bike vs training wheels](/guides/special/kids-bike-balance-vs-training-wheels)
- [Kids bike size chart](/guides/beginner/kids-bike-size-chart)
- [Helmet fit guide](/guides/risk/kids-bike-helmet-fit)`,
    },
    zh: {
      title: "怎么教小孩骑自行车（不用辅助轮）",
     content: `老办法——扶着座垫跑——管用，但更冷静的路是先教平衡再教踩踏。这篇讲大多数孩子一两节课就能掌握的分步法，以及如果辅助轮已经在车上该怎么办。

## 先放低座
把座放低，让孩子坐着能双脚平放地面。平脚才是他们不害怕地保持平衡的原因。这一个改动，解决大多数"我不会"的时刻。

## 第一步：先走，再滑
踏板装不装都行，先让孩子推车走，再抬脚滑短距离。他们学到平衡来自移动，而不是你扶着。[平衡车](/guides/special/kids-bike-balance-vs-training-wheels)已经教过这个；脚踏车也可以拆踏板一天，做同样的事。

## 第二步：最后才加踩踏
等他们自信滑行了，把踏板装回，让他们先推一下再踩。座保持低，让他们还能落脚。一两节课内，按[尺寸表](/guides/beginner/kids-bike-size-chart)把座升到正确高度。

## 如果辅助轮已经在
松开它们让它们勉强碰到，然后先拆一只、再拆两只，分几次骑行完成。每一步逼出多一点平衡。[平衡车 vs 辅助轮篇](/guides/special/kids-bike-balance-vs-training-wheels)讲为什么这点短暂的摇晃值得。

## 短而冷静
十分钟的成胜过一小时的挫败。趁他们赢的时候停。全程[头盔](/guides/risk/kids-bike-helmet-fit)都在头上，起点只能是平坦开阔、远离车流的地方。

## 延伸阅读
- [平衡车还是辅助轮](/guides/special/kids-bike-balance-vs-training-wheels)
- [儿童自行车尺寸表](/guides/beginner/kids-bike-size-chart)
- [头盔佩戴指南](/guides/risk/kids-bike-helmet-fit)`,
    },
  },
  {
    id: "guide-2026-bike-maintenance",
    slug: "kids-bike-chain-tire-care",
    category: "maintenance",
    taxonomy: { productCategory: "bicycle", topicCategory: "maintenance", topicOrder: 11 },
    seo: {
      en: {
        title: "Kids Bike Chain Tire Care",
        description: "A child's bike is ridden hard and stored worse. The chain and tire care that keep it safe and rolling: lube, pressure, and the pre-ride check.",
        keywords: ["kids bike maintenance", "clean bike chain child", "kids bike tire pressure", "bike chain lube"],
      },
      zh: {
        title: "儿童自行车链条与轮胎养护",
        description: "孩子的车骑得狠、放得糟。让车安全顺滑的几分钟链条与轮胎养护：上油、气压，以及骑前检查。",
        keywords: ["儿童自行车养护", "清洁自行车链条", "儿童车胎压", "自行车链上油"],
      },
    },
    en: {
      title: "Kids Bike Chain Tire Care",
      content: `Children's bikes take more abuse than they get care. This guide covers the small, regular habits that keep a kid's bike safe and rolling — and the two-minute check before every ride.

## The chain
A dry, rusty chain is stiff and can skip or snap. Every few weeks: wipe it with a rag, apply a drop of bicycle chain lube to each roller, spin the pedals, and wipe off the excess. A clean, lightly lubed chain lasts longer and shifts (or coasts) smoothly. If the bike has [gears](/guides/best/kids-bike-best-20-inch), the same routine keeps the derailleur happy.

## Tire pressure
Soft tires are hard to pedal and easy to pinch-flat. Check pressure with a gauge or a thumb; the sidewall lists the range. Inflate to the low end for a smoother ride on rough ground, the high end for paved speed. A tire that bulges under the child's weight is under-inflated.

## The pre-ride check
Before each ride, squeeze both tires, spin the wheels to check for rub, and confirm the brakes bite. Thirty seconds prevents most roadside stops. This matters more as the child gets faster and rides farther from home.

## Brakes and bolts
Hand brakes need pad clearance; coaster brakes need the chain taut. Periodically check that the seat and handlebar clamps are tight — children grow, and clamps loosen. The [coaster vs hand brake guide](/guides/special/kids-bike-coaster-vs-hand-brake) covers the two brake types if you are unsure what you are looking at.

## Storage
A bike left outside rusts. Store it dry and upright; a damp, lying-flat bike corrodes the chain and seizes the bearings within a season.

## Further reading
- [Best 16 inch bike 4-6 years](/guides/best/kids-bike-best-16-inch)
- [Best 20 inch bike 7-9 years](/guides/best/kids-bike-best-20-inch)
- [Coaster vs hand brake](/guides/special/kids-bike-coaster-vs-hand-brake)`,
    },
    zh: {
      title: "儿童自行车链条与轮胎养护",
     content: `孩子的车受的虐待多过得到的照顾。这篇讲那些小而规律的习惯，让儿童车安全顺滑——以及每次骑行前的两分钟检查。

## 链条
干、锈的链条发僵，会跳或断。每几周：用布擦，每节滚子滴一滴自行车链油，踩踏板转几圈，擦掉多余油。干净、薄薄上油层链更耐用，变速（或滑行）更顺。如果车有[变速](/guides/best/kids-bike-best-20-inch)，同一套让变速器也开心。

## 胎压
软胎难踩、易夹破。用气压表或拇指查；胎壁标着范围。粗糙地面骑，打到范围低端更顺；铺装路求速，打到高端。在孩子体重下鼓起的胎是欠压。

## 骑前检查
每次骑行前，捏两个胎，转轮看是否蹭，确认刹车咬得住。三十秒防住大多数路边抛锚。孩子越快、离家越远，这越要紧。

## 刹车与螺丝
手刹要刹皮间隙；脚刹要链条绷紧。定期查座管和车把夹是否紧——孩子长个，夹会松。[脚刹 vs 手刹篇](/guides/special/kids-bike-coaster-vs-hand-brake)讲两种刹车，如果你不确定在看什么。

## 存放
放外面的车会锈。干燥、立着存；潮湿、平躺的车一个季节内就把链条腐蚀、轴承卡死。

## 延伸阅读
- [4–6 岁最佳 16 寸车](/guides/best/kids-bike-best-16-inch)
- [7–9 岁最佳 20 寸车](/guides/best/kids-bike-best-20-inch)
- [脚刹还是手刹](/guides/special/kids-bike-coaster-vs-hand-brake)`,
    },
  },
  {
    id: "guide-2026-bike-brake",
    slug: "kids-bike-coaster-vs-hand-brake",
    category: "special",
    taxonomy: { productCategory: "bicycle", topicCategory: "special", topicOrder: 12 },
    seo: {
      en: {
        title: "Coaster vs Hand Brake Kids",
        description: "Coaster brakes are simple and need no hand strength; hand brakes teach the habit every later bike uses. What each gives up, by rider age and bike size.",
        keywords: ["coaster brake vs hand brake", "kids bike brake types", "hand brake kids bike", "coaster brake child"],
      },
      zh: {
        title: "儿童车脚刹还是手刹：怎么选",
        description: "脚刹简单、不需要手劲；手刹教的是以后每辆车上都用的习惯。各自在什么年龄和尺寸上让步。",
        keywords: ["脚刹还是手刹", "儿童车刹车类型", "手刹儿童车", "脚刹儿童车"],
      },
    },
    en: {
      title: "Coaster vs Hand Brake Kids",
      content: `Two brake types dominate children's bikes, and they feel nothing alike. This guide covers what each does, what it costs in later habits, and which to pick by age and bike size.

## Coaster brake (pedal backward)
A coaster brake stops the rear wheel when the child pedals backward. It needs no hand strength and is intuitive for a new rider. The downside: it locks the pedals, so the child cannot coast with feet up, and it teaches no skill they will use on an adult bike. Common on smaller bikes — see the [16 inch guide](/guides/best/kids-bike-best-16-inch).

## Hand brake (lever)
A hand brake stops with a lever at the grip and is what every bike past childhood uses. On a small, reach-adjustable lever it is learnable by age five or six. The downside: it needs hand strength and a little coordination, and cheap levers can be stiff. Standard from [20 inch up](/guides/best/kids-bike-best-20-inch).

## What each gives up
- **Coaster:** no coasting, no transferable skill, rear-wheel-only stop (less powerful).
- **Hand:** needs stronger hands, more to learn, but teaches the lifelong habit and can brake both wheels.

## Which to choose
- Small first bike (12-16 inch): a coaster, or both, is fine and low-stress.
- 20 inch and up: prioritize a good hand brake; a coaster at this size is a missed chance to learn.
- Nervous or very young rider: coaster first, hand brake learned alongside.

## Fit the brake to the hand
Whatever you choose, confirm the child can pull the lever to the bar (hand) or pedal back firmly (coaster). A brake they cannot use is no brake. A [helmet](/guides/risk/kids-bike-helmet-fit) is required either way.

## Further reading
- [Best 16 inch bike 4-6 years](/guides/best/kids-bike-best-16-inch)
- [Best 20 inch bike 7-9 years](/guides/best/kids-bike-best-20-inch)
- [Helmet fit guide](/guides/risk/kids-bike-helmet-fit)`,
    },
    zh: {
      title: "儿童车脚刹还是手刹：怎么选",
     content: `两种刹车主导儿童车，手感却完全不同。这篇讲每种做什么、在日后习惯上付出什么，以及按年龄和尺寸怎么挑。

## 脚刹（向后踩）
脚刹让孩子向后踩踏板时停住后轮。它不需要手劲，对新手直觉。缺点：锁住踏板，孩子不能抬脚滑行，也不教任何以后成人车上要用的技能。常见于小车——见[16 寸篇](/guides/best/kids-bike-best-16-inch)。

## 手刹（刹把）
手刹用握把上的刹把停住，是童年之后每辆车上用的。在小号、可调行程的刹把上，五六岁就能学。缺点：需要手劲和一点协调，便宜刹把可能发硬。从[20 寸起](/guides/best/kids-bike-best-20-inch)成为标配。

## 各自放弃的
- **脚刹：** 不能滑行、没有可迁移技能、只停后轮（力弱）。
- **手刹：** 需要更强的手、要学的更多，但教的是终身习惯，且能刹两轮。

## 怎么选
- 小的第一辆车（12–16 寸）：脚刹或两者都行，低压力。
- 20 寸及以上：优先好手刹；这个尺寸还用脚刹是错过学习机会。
- 紧张或很小的骑手：先脚刹，手刹并行学。

## 刹车要合手
无论选哪种，确认孩子能把刹把拉到车把（手刹）或稳稳向后踩（脚刹）。他们用不了的刹车等于没有。[头盔](/guides/risk/kids-bike-helmet-fit)哪种都必需。

## 延伸阅读
- [4–6 岁最佳 16 寸车](/guides/best/kids-bike-best-16-inch)
- [7–9 岁最佳 20 寸车](/guides/best/kids-bike-best-20-inch)
- [头盔佩戴指南](/guides/risk/kids-bike-helmet-fit)`,
    },
  },
  {
    id: "guide-2026-scooter-3-vs-2",
    slug: "kids-scooter-3-vs-2-wheel",
    category: "beginner",
    taxonomy: { productCategory: "scooter", topicCategory: "beginner", topicOrder: 11 },
    seo: {
      en: {
        title: "3 Wheel vs 2 Wheel Scooter",
        description: "Three wheels lean-to-steer and stay up; two wheels fold smaller and last longer. How to pick by age, route, and storage.",
        keywords: ["3 wheel vs 2 wheel scooter", "three wheel scooter for toddlers", "lean to steer scooter", "when 2 wheel scooter"],
      },
      zh: {
        title: "三轮还是两轮儿童滑板车",
        description: "三轮靠倾斜转向、立得稳；两轮折得小、用得久。怎么按年龄、路线和收纳来选。",
        keywords: ["三轮还是两轮滑板车", "幼儿三轮滑板车", "倾斜转向滑板车", "何时两轮滑板车"],
      },
    },
    en: {
      title: "3 Wheel vs 2 Wheel Scooter",
      content: `The first decision on a kids' scooter is the wheel count, and it is mostly a decision about the rider's age and where the scooter lives. This guide covers what three wheels and two wheels each give up.

## Three wheels: stable and intuitive
A three-wheel scooter with a lean-to-steer front end stays upright on its own, so a two-year-old can ride without the bike-like fear of tipping. Steering by leaning matches how small children already move. The trade is bulk: three wheels do not fold as flat, and the deck is wider.

## Two wheels: compact and longer-lived
A two-wheel scooter folds small, rolls faster, and survives years of school-run use. But it needs the balance a three-wheel model trains, so it suits roughly age six and up, or a confident younger rider. See the [best scooter for a 4 year old](/guides/best/kids-scooter-best-4-year) for where the handoff sits.

## Pick by age and route
- **Age 2-5, hallway and park:** three wheels, lean-to-steer.
- **Age 6+, school commute, transit:** two wheels, folding.
- **Unsure:** a [foldable travel scooter](/guides/best/kids-scooter-foldable-travel) that starts at the older end of the range.

## What both need
An adjustable stem so the scooter grows with the child (the [height guide](/guides/category_spec/kids-scooter-adjustable-height) covers how long that really lasts), a rear foot brake that is easy to reach, and wheels big enough for the surface. A [helmet and pads](/guides/risk/kids-scooter-helmet-pads) are required on either style.

## The electric question
If you are weighing a powered model, that is a different machine with a minimum age and speed rules — the [kick vs electric guide](/guides/special/kids-scooter-kick-vs-electric) explains why this site only publishes kick scooters.

## Further reading
- [Best scooter for a 4 year old](/guides/best/kids-scooter-best-4-year)
- [Foldable scooter for travel](/guides/best/kids-scooter-foldable-travel)
- [Adjustable height scooter](/guides/category_spec/kids-scooter-adjustable-height)
- [Scooter helmet and pad set](/guides/risk/kids-scooter-helmet-pads)`,
    },
    zh: {
      title: "三轮还是两轮儿童滑板车",
      content: `给孩子选滑板车的第一个决定是轮子数，而这基本是在决定骑行者的年龄和车放在哪。这篇讲三轮和两轮各自放弃什么。

## 三轮：稳、直觉
带倾斜转向前端的三轮滑板车自己就能立住，所以两岁孩子能骑，没有自行车那种怕倒的恐惧。靠倾斜转向，正合小孩子本来的移动方式。代价是体积：三轮折得没那么平，踏板也更宽。

## 两轮：紧凑、耐用
两轮滑板车折得小、滚得快，能扛几年上学通勤。但它需要三轮训练出来的平衡，所以适合约六岁及以上，或自信的更小骑手。这个交接点见[4 岁最佳滑板车](/guides/best/kids-scooter-best-4-year)。

## 按年龄和路线选
- **2–5 岁、走廊和公园：** 三轮，倾斜转向。
- **6 岁+、上学通勤、公共交通：** 两轮，可折叠。
- **不确定：** 一辆从范围大龄端起步的[旅行折叠车](/guides/best/kids-scooter-foldable-travel)。

## 两种都要的
可调把立，让车随孩子长（[高度指南](/guides/category_spec/kids-scooter-adjustable-height)讲这到底能用多久）、好够到的后脚刹，以及够大、适配路面的轮子。哪种款式都要[头盔和护具](/guides/risk/kids-scooter-helmet-pads)。

## 电动的问题
如果你在考虑动力款，那是另一台机器，有最低年龄和速度规则——[kick 还是电动篇](/guides/special/kids-scooter-kick-vs-electric)讲为什么本站只发 kick 滑板车。

## 延伸阅读
- [4 岁最佳滑板车](/guides/best/kids-scooter-best-4-year)
- [旅行折叠滑板车](/guides/best/kids-scooter-foldable-travel)
- [可调节高度滑板车](/guides/category_spec/kids-scooter-adjustable-height)
- [滑板车头盔护具套装](/guides/risk/kids-scooter-helmet-pads)`,
    },
  },
  {
    id: "guide-2026-scooter-best-4",
    slug: "kids-scooter-best-4-year",
    category: "best",
    taxonomy: { productCategory: "scooter", topicCategory: "best", topicOrder: 11 },
    seo: {
      en: {
        title: "Best Scooter for a 4 Year Old",
        description: "At four, a child is between the three-wheel toddler stage and the two-wheel school stage. Check wheel count, stem range, and a brake they reach.",
        keywords: ["best scooter for 4 year old", "scooter for 4 year old boy girl", "4 year old first scooter", "lean to steer 4 year old"],
      },
      zh: {
        title: "4 岁孩子最佳滑板车",
        description: "四岁处在三轮幼儿阶段和两轮上学阶段之间。该查什么：轮数、把立范围，以及够得到的刹车。",
        keywords: ["4岁最佳滑板车", "4岁孩子滑板车", "4岁第一辆滑板车", "倾斜转向4岁"],
      },
    },
    en: {
      title: "Best Scooter for a 4 Year Old",
      content: `Four is the awkward middle of scooter ownership: old enough for a two-wheeler in many cases, young enough that a three-wheeler still removes fear. This guide covers how to pick without guessing.

## Start with the wheel count
Many four-year-olds do well on a lean-to-steer three-wheeler because it stays up on its own. If the child already rides a balance bike confidently, a small two-wheeler is a reasonable step. The [3 vs 2 wheel guide](/guides/beginner/kids-scooter-3-vs-2-wheel) lays out the handoff.

## Stem height beats the age label
Check the adjustable range, not the box age. A four-year-old needs the handlebar at hip-to-waist height with a slight bend in the elbows. A scooter whose lowest setting is already too high will be outgrown fast or ridden unsafely. The [height guide](/guides/category_spec/kids-scooter-adjustable-height) shows how to read the range.

## Brake they can actually use
A rear foot brake should engage with a natural step, not a stretch. Hand brakes on scooters are rare at this age and often too stiff; a foot brake is the safer default.

## Deck and wheels
A wide, low deck is easier to stand on and step onto. Wheels around 120mm roll over pavement cracks; smaller wheels suit smooth indoor floors. For a first scooter, bigger is friendlier.

## Safety first
A [helmet and pad set](/guides/risk/kids-scooter-helmet-pads) is required, and a four-year-old should ride flat ground away from traffic. The [under-$50 guide](/guides/budget/kids-scooter-under-50) lists what a cheaper first scooter should still include.

## Further reading
- [3 wheel vs 2 wheel scooter](/guides/beginner/kids-scooter-3-vs-2-wheel)
- [Adjustable height scooter](/guides/category_spec/kids-scooter-adjustable-height)
- [Scooter helmet and pad set](/guides/risk/kids-scooter-helmet-pads)
- [Best scooter under $50](/guides/budget/kids-scooter-under-50)`,
    },
    zh: {
      title: "4 岁孩子最佳滑板车",
      content: `四岁是滑板车拥有期的尴尬中间：多数情况下够上两轮，又年轻到三轮仍能消除恐惧。这篇讲怎么选而不靠猜。

## 先从轮子数开始
很多四岁孩子在倾斜转向三轮上表现很好，因为它自己立着。如果孩子已经能自信骑平衡车，小两轮是合理的一步。[三轮 vs 两轮篇](/guides/beginner/kids-scooter-3-vs-2-wheel)讲清交接。

## 把立高度胜过年龄标签
看可调范围，不是盒子上的年龄。四岁孩子需要把横在髋到腰之间、手肘微弯。最低设置就太高的车，会很快被淘汰或骑得不安全。[高度指南](/guides/category_spec/kids-scooter-adjustable-height)讲怎么读范围。

## 他们真能用的刹车
后脚刹应自然一踩就生效，而不是够。滑板车手刹在这个年龄很少、常太硬；脚刹是更安全的默认。

## 踏板与轮子
宽、低的踏板更好站、更好上。约 120mm 的轮子碾过 pavement 裂缝；更小的轮适合光滑室内地。第一辆车，大一点更友好。

## 安全优先
[头盔护具套装](/guides/risk/kids-scooter-helmet-pads)必需，四岁孩子应在远离车流的平地骑。[百元以内篇](/guides/budget/kids-scooter-under-50)列了便宜第一辆车仍该有的。

## 延伸阅读
- [三轮还是两轮滑板车](/guides/beginner/kids-scooter-3-vs-2-wheel)
- [可调节高度滑板车](/guides/category_spec/kids-scooter-adjustable-height)
- [滑板车头盔护具套装](/guides/risk/kids-scooter-helmet-pads)
- [50 美元内最佳滑板车](/guides/budget/kids-scooter-under-50)`,
    },
  },
  {
    id: "guide-2026-scooter-school",
    slug: "kids-scooter-best-6-8-school",
    category: "scenario",
    taxonomy: { productCategory: "scooter", topicCategory: "scenario", topicOrder: 11 },
    seo: {
      en: {
        title: "Best Kick Scooter 6-8 to School",
        description: "For the school run, a two-wheel folding scooter beats a toddler model. What to check: fold, weight, wheel size, and a brake that survives daily use.",
        keywords: ["scooter to school", "kick scooter 6 year old", "folding scooter school run", "scooter 8 year old"],
      },
      zh: {
        title: "6–8 岁上学最佳滑板车",
        description: "上学路，两轮折叠滑板车胜过幼儿款。该查什么：折叠、重量、轮径，以及经得起每天用的刹车。",
        keywords: ["上学滑板车", "6岁kick滑板车", "折叠滑板车通勤", "8岁滑板车"],
      },
    },
    en: {
      title: "Best Kick Scooter 6-8 to School",
      content: `The school run is where a scooter earns its keep: a two-wheel folding model that a six-to-eight-year-old can carry onto a bus and stash at a desk. This guide covers what to look for in a daily commuter scooter.

## Two wheels and a real fold
A toddler three-wheeler is too slow and too bulky for this job. A two-wheel scooter that folds to a flat brick and locks closed is what survives a corridor and a cubby. The [3 vs 2 wheel guide](/guides/beginner/kids-scooter-3-vs-2-wheel) explains the step up.

## Weight the child can carry
The scooter gets carried as often as ridden. Aim for something the child can lift one-handed; anything heavy becomes yours to carry. A [foldable travel scooter](/guides/best/kids-scooter-foldable-travel) is built around this.

## Wheels for real surfaces
School routes mix pavement, curbs, and the occasional crack. Wheels of 120-180mm roll these without a jolt; tiny wheels do not. Larger, softer wheels also mean a quieter, less punishing ride.

## Brake that lasts
A rear foot brake sees daily use; check that it is metal-faced and not worn thin. A scooter that cannot stop reliably is not a commuter. Compare this against a [bike for short trips](/guides/special/kids-scooter-vs-bike-commute) if the distance is longer than a scooter suits.

## Safety on the route
A [helmet and pad set](/guides/risk/kids-scooter-helmet-pads) is mandatory, and the child should know to walk the scooter across driveways and never ride near traffic. Reflective bits help on dim mornings.

## Further reading
- [Foldable scooter for travel](/guides/best/kids-scooter-foldable-travel)
- [Scooter vs bike for short trips](/guides/special/kids-scooter-vs-bike-commute)
- [Scooter helmet and pad set](/guides/risk/kids-scooter-helmet-pads)`,
    },
    zh: {
      title: "6–8 岁上学最佳滑板车",
      content: `上学路是滑板车证明价值的地方：一辆两轮折叠车，六到八岁孩子能搬上公交、塞进课桌。这篇讲日常通勤滑板车该看什么。

## 两轮加真折叠
幼儿的那种三轮又慢又笨，不适合这活。一辆折成扁平砖块、能锁住的两轮车，才扛得住走廊和储物柜。[三轮 vs 两轮篇](/guides/beginner/kids-scooter-3-vs-2-wheel)讲这个升级。

## 孩子拎得动的重量
滑板车被拎的次数和骑的次数一样多。找孩子能单手拎的；重的就成了你的负担。一辆[旅行折叠车](/guides/best/kids-scooter-foldable-travel)就是围绕这点造的。

## 真路面的轮子
上学路混着铺装、路缘，偶尔裂缝。120–180mm 的轮子碾过不颠；小轮不行。更大更软的轮也意味着更安静、更不折磨的骑行。

## 经得起的刹车
后脚刹每天用；确认它是金属面、没磨薄。停不住的滑板车不是通勤车。如果距离超出滑板车合适的范围，和[短途自行车](/guides/special/kids-scooter-vs-bike-commute)比一比。

## 路线上的安全
[头盔护具套装](/guides/risk/kids-scooter-helmet-pads)强制，孩子该知道穿过车道时推着走、绝不在车流边骑。反光件在昏暗早晨有用。

## 延伸阅读
- [旅行折叠滑板车](/guides/best/kids-scooter-foldable-travel)
- [短途滑板车还是自行车](/guides/special/kids-scooter-vs-bike-commute)
- [滑板车头盔护具套装](/guides/risk/kids-scooter-helmet-pads)`,
    },
  },
  {
    id: "guide-2026-scooter-kick-vs-electric",
    slug: "kids-scooter-kick-vs-electric",
    category: "special",
    taxonomy: { productCategory: "scooter", topicCategory: "special", topicOrder: 11 },
    seo: {
      en: {
        title: "Kick Scooter vs Electric Scooter",
        description: "A powered scooter is a different machine with a minimum age and speed rules. Why we publish only kick scooters, and what to check if you buy electric.",
        keywords: ["kick scooter vs electric scooter", "electric scooter for kids age", "kids electric scooter safe", "powered scooter child"],
      },
      zh: {
        title: "儿童 kick 滑板车还是电动滑板车",
        description: "动力滑板车是另一台机器，有最低年龄和速度规则。为什么本站只发 kick 滑板车，以及买电动款该查什么。",
        keywords: ["kick还是电动滑板车", "儿童电动滑板车年龄", "儿童电动滑板车安全", "动力滑板车"],
      },
    },
    en: {
      title: "Kick Scooter vs Electric Scooter",
      content: `A kick scooter and a powered scooter share a name and a deck, but they are different machines with different rules. This guide explains the divide and why this site's scooter comparisons stay on kick models.

## What a kick scooter is
Human-powered: the child kicks to move and brakes with a foot or hand. No battery, no speed beyond what legs make, no minimum-age ambiguity beyond balance. Every scooter published here is a kick scooter, so the [3 vs 2 wheel guide](/guides/beginner/kids-scooter-3-vs-2-wheel) and the [best 4 year old pick](/guides/best/kids-scooter-best-4-year) stay on things we can verify from the listing.

## What an electric scooter adds
A motor, a battery, and a top speed. That changes the safety math: a child on a powered scooter can outrun their braking skill and their supervision. Most regions set a minimum age and a speed class, and helmets stop being optional in practice.

## Why we do not publish electric
We will not review a product whose key numbers — top speed, motor output, battery behavior — we cannot verify from a listing, and whose safety depends on rules that vary by region. The [helmet and pad guide](/guides/risk/kids-scooter-helmet-pads) still applies, and applies harder.

## If you buy electric anyway
Take the minimum age, top speed, and brake type from the manufacturer directly, not from a review. Insist on a helmet rated for the speed, supervise every ride, and keep it off public roads until local rules allow. A kick scooter remains the safer first machine for balance and judgment.

## Further reading
- [3 wheel vs 2 wheel scooter](/guides/beginner/kids-scooter-3-vs-2-wheel)
- [Best scooter for a 4 year old](/guides/best/kids-scooter-best-4-year)
- [Scooter helmet and pad set](/guides/risk/kids-scooter-helmet-pads)`,
    },
    zh: {
      title: "儿童 kick 滑板车还是电动滑板车",
      content: `kick 滑板车和动力滑板车共享名字和踏板，但是两台规则不同的机器。这篇讲这道分界，以及为什么本站的滑板车对比只停留在 kick 款。

## kick 滑板车是什么
人力驱动：孩子靠蹬动前进，用脚或手刹车。没有电池、没有超出腿能造的速度、没有除平衡外的最低年龄模糊。本站发的每辆滑板车都是 kick 款，所以[三轮 vs 两轮篇](/guides/beginner/kids-scooter-3-vs-2-wheel)和[4 岁精选](/guides/best/kids-scooter-best-4-year)都停留在我们能从列表核对的范围内。

## 电动款多了什么
电机、电池和最高速度。这改变了安全算式：动力滑板车上的孩子能跑过自己的刹车技能和监护。多数地区设了最低年龄和速度等级，头盔在实践中不再是可选。

## 为什么我们不发电动
我们不会评测一辆关键数字——最高速度、电机输出、电池行为——无法从列表核实、安全又依赖随地区而变规则的产品。[头盔护具指南](/guides/risk/kids-scooter-helmet-pads)仍然适用，而且更该适用。

## 如果你还是买电动
最低年龄、最高速度、刹车类型直接从厂商拿，别从评测拿。坚持要一顶为那个速度评级的头盔，每次骑行都监护，在当地规则允许前别上公共道路。kick 滑板车仍是平衡和判断上更安全的第一台机器。

## 延伸阅读
- [三轮还是两轮滑板车](/guides/beginner/kids-scooter-3-vs-2-wheel)
- [4 岁最佳滑板车](/guides/best/kids-scooter-best-4-year)
- [滑板车头盔护具套装](/guides/risk/kids-scooter-helmet-pads)`,
    },
  },
  {
    id: "guide-2026-scooter-helmet",
    slug: "kids-scooter-helmet-pads",
    category: "risk",
    taxonomy: { productCategory: "scooter", topicCategory: "risk", topicOrder: 11 },
    seo: {
      en: {
        title: "Scooter Helmet and Pad Set",
        description: "Scooter falls are wrist and knee falls. The helmet fit rules that carry over from bikes, plus why pads matter more on a scooter than a bike.",
        keywords: ["scooter helmet", "kids scooter pads", "wrist guard scooter", "scooter safety gear"],
      },
      zh: {
        title: "儿童滑板车头盔与护具套装",
        description: "滑板车摔倒多是手腕和膝盖着地。从自行车沿用下来的头盔佩戴规则，以及为什么护具在滑板车上比自行车更要紧。",
        keywords: ["滑板车头盔", "儿童滑板车护具", "滑板车护腕", "滑板车安全装备"],
      },
    },
    en: {
      title: "Scooter Helmet and Pad Set",
      content: `A scooter fall is not a bike fall. There is no frame to catch a child, so they go down hands-first — which is why pads matter more here than on a bike. This guide covers the gear and the fit.

## Helmet: same rules as bikes
The [bike helmet guide](/guides/risk/kids-bike-helmet-fit) applies directly: level on the head, two finger-widths above the brows, a Y under each ear, and no more than one or two fingers of slack at the chin. A scooter helmet is the same object; do not buy a separate one thinking it is different.

## Pads: knees, elbows, wrists
Scooter falls favor the hands and knees because the rider has nothing to brace with. A basic set of knee and elbow pads, plus wrist guards for beginners, prevents most of the scrapes and the wrist sprains that send children to urgent care. This is the gear that matters more on a scooter than a bike.

## Fit the pads
Pads should cover the joint and stay put during a fall, not slide to the side. Adjust straps so they are snug but not cutting circulation. Loose pads are worse than none because they give false confidence.

## Surfaces and supervision
Most scooter injuries happen on the first ride on a new surface. Start on flat, smooth ground, watch the first descent, and keep the [3 vs 2 wheel choice](/guides/beginner/kids-scooter-3-vs-2-wheel) stable before speed builds.

## Further reading
- [Kids bike helmet fit](/guides/risk/kids-bike-helmet-fit)
- [3 wheel vs 2 wheel scooter](/guides/beginner/kids-scooter-3-vs-2-wheel)
- [Best scooter for a 4 year old](/guides/best/kids-scooter-best-4-year)`,
    },
    zh: {
      title: "儿童滑板车头盔与护具套装",
      content: `滑板车摔倒不是自行车摔倒。没有车架接住孩子，所以他们手先着地——这就是为什么护具在这里比自行车更要紧。这篇讲装备和佩戴。

## 头盔：和自行车同规则
[自行车头盔指南](/guides/risk/kids-bike-helmet-fit)直接适用：水平戴在头上、眉上两指宽、每只耳下成 Y、下巴下最多一两指松弛。滑板车头盔是同一个东西；别以为不同而去买另一顶。

## 护具：膝、肘、腕
滑板车摔倒偏向手和膝，因为骑行者没有东西可撑。一套基础膝肘护具，加初学者的护腕，能防住大多数擦伤和送急诊的腕扭伤。这就是比自行车更要紧的装备。

## 护具要合身
护具应盖住关节、摔倒时不滑到一边。调绑带让它们贴身但不阻断循环。松的护具比没有更糟，因为它给错误的安全感。

## 路面与监护
多数滑板车伤发生在新路面上的第一次骑。从平坦光滑的地面起步，看第一次下坡，在速度起来前保持[三轮还是两轮的选择](/guides/beginner/kids-scooter-3-vs-2-wheel)稳定。

## 延伸阅读
- [儿童自行车头盔佩戴](/guides/risk/kids-bike-helmet-fit)
- [三轮还是两轮滑板车](/guides/beginner/kids-scooter-3-vs-2-wheel)
- [4 岁最佳滑板车](/guides/best/kids-scooter-best-4-year)`,
    },
  },
  {
    id: "guide-2026-scooter-foldable",
    slug: "kids-scooter-foldable-travel",
    category: "best",
    taxonomy: { productCategory: "scooter", topicCategory: "best", topicOrder: 12 },
    seo: {
      en: {
        title: "Best Foldable Scooter for Travel",
        description: "A travel scooter lives or dies on the fold and the weight. What to check: locked fold, one-hand carry, and wheels that survive being checked and carried.",
        keywords: ["foldable kids scooter", "travel scooter for kids", "lightweight folding scooter", "compact scooter travel"],
      },
      zh: {
        title: "旅行最佳轻便折叠滑板车",
        description: "旅行滑板车的生死在折叠和重量。该查什么：锁住的折叠、单手拎、以及经得起托运和搬运的轮子。",
        keywords: ["折叠儿童滑板车", "儿童旅行滑板车", "轻便折叠滑板车", "紧凑旅行滑板车"],
      },
    },
    en: {
      title: "Best Foldable Scooter for Travel",
      content: `A travel scooter is judged by what happens when no one is riding it: the fold must lock, the weight must be carryable, and the wheels must survive being lugged through an airport. This guide covers the checks.

## The fold must lock
A fold that springs open in a overhead bin is a hazard and a nuisance. Look for a scooter whose folded state latches closed and stays, not one held by friction. Test it before you travel.

## Weight a child (or you) can carry
Travel means carrying. Aim for the lightest two-wheel model that still has a usable stem range and a real brake. A scooter the child cannot lift becomes the adult's bag. The [school-run guide](/guides/scenario/kids-scooter-best-6-8-school) values the same property.

## Wheels that take abuse
Airport floors and car trunks are unkind. Medium wheels (around 120-180mm) survive better than tiny ones, and a deck that does not flex under a bag weighs less on the structure. The [adjustable height guide](/guides/category_spec/kids-scooter-adjustable-height) explains why a taller range also helps travel, since the scooter can serve the child for years.

## What to skip
Heavy three-wheel "trick" scooters do not fold flat and are miserable to carry. A simple two-wheel folder is the travel answer. A [helmet](/guides/risk/kids-scooter-helmet-pads) still travels with you.

## Further reading
- [Scooter for school run](/guides/scenario/kids-scooter-best-6-8-school)
- [Adjustable height scooter](/guides/category_spec/kids-scooter-adjustable-height)
- [Scooter helmet and pad set](/guides/risk/kids-scooter-helmet-pads)`,
    },
    zh: {
      title: "旅行最佳轻便折叠滑板车",
      content: `旅行滑板车的评判标准是没人骑它时发生了什么：折叠必须锁住、重量必须拎得动、轮子必须扛得过被拖着过机场。这篇讲这些检查。

## 折叠必须锁住
在头顶行李舱里弹开的折叠是隐患也是麻烦。找一辆折叠状态能扣住并维持的车，而不是靠摩擦撑着的。出行前试一下。

## 孩子（或你）拎得动的重量
旅行意味着搬运。在仍有可用把立范围和真刹车的前提下，挑最轻的两轮款。孩子拎不动的车成了大人的包。[上学通勤篇](/guides/scenario/kids-scooter-best-6-8-school)看重同一属性。

## 经得起虐的轮子
机场地面和车尾箱不留情。中等轮（约 120–180mm）比小轮更扛，踏板不在包压下弯也对结构更轻。为什么更高的可调范围也有助旅行——因为车能服务孩子多年。

## 该跳过
重型三轮"特技"车折不平、搬着难受。简单的两轮折叠才是旅行答案。还是要有[头盔](/guides/risk/kids-scooter-helmet-pads)。

## 延伸阅读
- [上学通勤滑板车](/guides/scenario/kids-scooter-best-6-8-school)
- [可调节高度滑板车](/guides/category_spec/kids-scooter-adjustable-height)
- [滑板车头盔护具套装](/guides/risk/kids-scooter-helmet-pads)`,
    },
  },
  {
    id: "guide-2026-scooter-height",
    slug: "kids-scooter-adjustable-height",
    category: "category_spec",
    taxonomy: { productCategory: "scooter", topicCategory: "category_spec", topicOrder: 11 },
    seo: {
      en: {
        title: "Adjustable Height Scooter Guide",
        description: "An adjustable stem is what lets one scooter span three years. How to read the height range, and why the lowest and highest settings both matter.",
        keywords: ["adjustable height scooter", "scooter stem height range", "scooter grows with child", "scooter handlebar height"],
      },
      zh: {
        title: "可调节高度滑板车指南",
        description: "可调把立让一辆滑板车横跨三年。怎么读高度范围，以及为什么最低和最高设置都紧要。",
        keywords: ["可调节高度滑板车", "滑板车把立高度", "滑板车随孩子长", "滑板车把横高度"],
      },
    },
    en: {
      title: "Adjustable Height Scooter Guide",
      content: `The single feature that decides how long a scooter lasts is the adjustable stem. This guide covers how to read the height range and why both ends matter.

## Read the range, not the claim
Listings say "adjustable," but the useful number is the span between the lowest and highest handlebar settings, and whether the child sits inside it now. A scooter that only adjusts upward from too-high is wrong today; one whose top is below the child's waist is wrong next year.

## Why the low end matters
The lowest setting decides whether a small child can ride now with a slight elbow bend and the deck within step. Too high, and the child rides with locked arms and no control. The [4 year old guide](/guides/best/kids-scooter-best-4-year) treats this as the first check.

## Why the high end matters
The top setting decides how many years the scooter serves. A range that reaches waist height on an eight-year-old is a scooter that does not get outgrown at six. This is what makes a [foldable travel scooter](/guides/best/kids-scooter-foldable-travel) worth buying rather than a fixed one.

## Mechanism quality
A clamp that slips is dangerous; a threadless or quality quick-release stem holds. Check that the adjustment is secure and tool-light, because it happens often as the child grows.

## Further reading
- [Best scooter for a 4 year old](/guides/best/kids-scooter-best-4-year)
- [Foldable scooter for travel](/guides/best/kids-scooter-foldable-travel)
- [3 wheel vs 2 wheel scooter](/guides/beginner/kids-scooter-3-vs-2-wheel)`,
    },
    zh: {
      title: "可调节高度滑板车指南",
      content: `决定一辆滑板车能用多久的单一特性，是可调把立。这篇讲怎么读高度范围，以及为什么两端都紧要。

## 读范围，不读宣传
列表写"可调"，但有用的数字是把手最低到最高设置之间的跨度，以及孩子现在是否落在里面。只能从太高往上调的，今天就是错；顶端低于孩子腰的，明年就是错。

## 为什么低端紧要
最低设置决定小车现在能否骑：手肘微弯、踏板在一步之内。太高，孩子锁着胳膊骑、没控制。[4 岁篇](/guides/best/kids-scooter-best-4-year)把这当第一检查。

## 为什么高端紧要
顶端设置决定车服务多少年。能到八岁孩子腰高的范围，是一辆不会在六岁就被淘汰的车。这正是[旅行折叠车](/guides/best/kids-scooter-foldable-travel)值得买、而非固定款的原因。

## 机构质量
会滑的夹危险；无螺纹或优质快拆把立撑得住。确认调节牢固、少工具，因为孩子长高时它常动。

## 延伸阅读
- [4 岁最佳滑板车](/guides/best/kids-scooter-best-4-year)
- [旅行折叠滑板车](/guides/best/kids-scooter-foldable-travel)
- [三轮还是两轮滑板车](/guides/beginner/kids-scooter-3-vs-2-wheel)`,
    },
  },
  {
    id: "guide-2026-scooter-fix",
    slug: "kids-scooter-fix-wobbly-wheel",
    category: "maintenance",
    taxonomy: { productCategory: "scooter", topicCategory: "maintenance", topicOrder: 11 },
    seo: {
      en: {
        title: "Fix a Wobbly Scooter Wheel",
        description: "A wobbly wheel or a loose folding latch is a five-minute fix until it is not. The checks that keep a kids' scooter safe: axle, clamp, and brake.",
        keywords: ["fix scooter wheel", "wobbly scooter wheel repair", "scooter folding latch loose", "scooter maintenance"],
      },
      zh: {
        title: "滑板车轮子松动怎么修",
        description: "松动的轮子或松开的折叠锁扣，在变成问题前是五分钟能修好的。让儿童滑板车安全的检查：轴、夹、刹车。",
        keywords: ["修滑板车轮子", "滑板车轮子晃", "滑板车折叠锁扣松", "滑板车养护"],
      },
    },
    en: {
      title: "Fix a Wobbly Scooter Wheel",
      content: `A kids' scooter takes daily abuse, and the first sign is usually a wobble or a loose fold. This guide covers the five-minute checks that keep it safe.

## The wheel
A wheel that wobbles side to side usually means a loose axle nut or a deformed wheel core. Tighten the axle with the supplied tool; if the wheel still wobbles, the core is damaged and the wheel should be replaced. Spin each wheel and watch for sideways play.

## The folding latch
A fold that creaks or drifts is a clamp that has loosened. Tighten the folding clamp so the deck locks square; a fold that moves under a child's weight is a fall waiting to happen. This matters most on a [foldable travel scooter](/guides/best/kids-scooter-foldable-travel).

## The brake
A rear foot brake wears down. Check that it still bites and is not worn to the deck; a thin brake is a brake that fails. Replace it before it goes.

## The stem clamp
The adjustable stem must stay put. A clamp that slips mid-ride drops the handlebar; tighten it and confirm the height setting is secure, as the [height guide](/guides/category_spec/kids-scooter-adjustable-height) relies on.

## Do it often
These checks take minutes and prevent most roadside stops and a fair share of falls. Pair them with the [best 4 year old pick](/guides/best/kids-scooter-best-4-year) when buying, since a sound scooter starts sound.

## Further reading
- [Best scooter for a 4 year old](/guides/best/kids-scooter-best-4-year)
- [Foldable scooter for travel](/guides/best/kids-scooter-foldable-travel)
- [Adjustable height scooter](/guides/category_spec/kids-scooter-adjustable-height)`,
    },
    zh: {
      title: "滑板车轮子松动怎么修",
      content: `儿童滑板车每天受虐，第一个信号通常是晃动或折叠松。这篇讲让车安全的五分钟检查。

## 轮子
左右晃的轮通常是轴螺母松或轮芯变形。用随附工具拧紧轴；如果还晃，轮芯已损，应换轮。转每个轮，看是否有横向旷量。

## 折叠锁扣
发出咯吱或漂移的折叠，是松掉的夹。拧紧折叠夹，让踏板锁正；在孩子体重下移动的折叠，是一场等着发生的摔倒。这在[旅行折叠车](/guides/best/kids-scooter-foldable-travel)上最要紧。

## 刹车
后脚刹会磨。确认它仍咬得住、没磨到踏板；薄的刹是失灵的刹。在它失效前换。

## 把立夹
可调把立必须不动。骑行中滑的夹会让车把掉；拧紧并确认高度设置牢固，[高度指南](/guides/category_spec/kids-scooter-adjustable-height)正依赖此。

## 常做
这些检查花几分钟，防住大多数路边抛锚和不少摔倒。买时配[4 岁精选](/guides/best/kids-scooter-best-4-year)，因为一辆好车从好开始。

## 延伸阅读
- [4 岁最佳滑板车](/guides/best/kids-scooter-best-4-year)
- [旅行折叠滑板车](/guides/best/kids-scooter-foldable-travel)
- [可调节高度滑板车](/guides/category_spec/kids-scooter-adjustable-height)`,
    },
  },
  {
    id: "guide-2026-scooter-under-50",
    slug: "kids-scooter-under-50",
    category: "budget",
    taxonomy: { productCategory: "scooter", topicCategory: "budget", topicOrder: 11 },
    seo: {
     en: {
        title: "Best Scooter Under $50",
        description: "A cheap scooter can still be safe if it has a real brake, a secure fold, and wheels that roll. The non-negotiables under $50, and what to skip.",
        keywords: ["scooter under 50", "cheap kids scooter", "best budget scooter", "affordable kick scooter"],
      },
      zh: {
        title: "50 美元以内最佳滑板车",
        description: "便宜滑板车只要有真刹车、牢固折叠和能滚的轮子，仍可安全。百元内的不可妥协项，以及该跳过的。",
        keywords: ["50美元滑板车", "便宜儿童滑板车", "性价比滑板车", "平价kick滑板车"],
      },
    },
    en: {
      title: "Best Scooter Under $50",
      content: `A low price does not have to mean an unsafe scooter. This guide covers the specs a sub-$50 scooter must still have, and the corner that is not worth cutting.

## Non-negotiable under $50
- **A working brake.** A rear foot brake that bites. No brake, no deal.
- **A secure fold or a solid fixed deck.** A fold that will not stay closed is a hazard; a fixed deck is fine if it is not gigantic.
- **Wheels that roll straight.** Spin them; a wheel that wobbles is a wheel to avoid (the [wobbly wheel fix](/guides/maintenance/kids-scooter-fix-wobbly-wheel) covers what to do if it appears later).
- **An adjustable stem** so the scooter fits now and later — see the [height guide](/guides/category_spec/kids-scooter-adjustable-height).

## Where cheap scooters cut
Budget models use heavier steel and simpler clamps. Neither is unsafe by itself, but a heavy scooter is one the child will not carry and will abandon. Favor the lightest option in your size window, such as the [best 4 year old pick](/guides/best/kids-scooter-best-4-year).

## Skip the character branding
Cartoon-branded scooters at this price are usually the heaviest and least adjustable. The character adds price, not ride quality.

## Safety is not budget-dependent
A [helmet and pad set](/guides/risk/kids-scooter-helmet-pads) is required at every price, and a scooter that fits matters more than the sticker.

## Further reading
- [Best scooter for a 4 year old](/guides/best/kids-scooter-best-4-year)
- [Adjustable height scooter](/guides/category_spec/kids-scooter-adjustable-height)
- [Scooter helmet and pad set](/guides/risk/kids-scooter-helmet-pads)`,
    },
    zh: {
      title: "50 美元以内最佳滑板车",
      content: `低价不必等于不安全的滑板车。这篇讲百元内滑板车仍必须有的规格，以及不值得省的那一刀。

## 百元内不可妥协
- **能用的刹车。** 咬得住的后脚刹。没刹车，免谈。
- **牢固的折叠或结实固定踏板。** 合不拢的折叠是隐患；固定踏板只要不大得离谱就成。
- **走得直的轮子。** 转它们；晃的轮是避开的轮（之后出现见[晃轮修复](/guides/maintenance/kids-scooter-fix-wobbly-wheel)）。
- **可调把立**，让车现在和以后都合身——见[高度指南](/guides/category_spec/kids-scooter-adjustable-height)。

## 便宜车在哪里省
预算款用更重的钢和更简单的夹。两者本身都不危险，但重的车是孩子不会拎、会弃的车。在你的尺寸窗口里挑最轻的，比如[4 岁精选](/guides/best/kids-scooter-best-4-year)。

## 跳过角色品牌
这个价的卡通品牌滑板车通常最重、最不可调。角色加的是价格，不是骑行质量。

## 安全不随预算变
[头盔护具套装](/guides/risk/kids-scooter-helmet-pads)在任何价位都必需，合身的车比标价更紧要。

## 延伸阅读
- [4 岁最佳滑板车](/guides/best/kids-scooter-best-4-year)
- [可调节高度滑板车](/guides/category_spec/kids-scooter-adjustable-height)
- [滑板车头盔护具套装](/guides/risk/kids-scooter-helmet-pads)`,
    },
  },
  {
    id: "guide-2026-scooter-vs-bike",
    slug: "kids-scooter-vs-bike-commute",
    category: "special",
    taxonomy: { productCategory: "scooter", topicCategory: "special", topicOrder: 12 },
    seo: {
      en: {
        title: "Scooter vs Bike for Short Trips",
        description: "For under a mile, a scooter is lighter, cheaper, and easier to carry; a bike goes farther and faster. How to choose by distance and the child.",
        keywords: ["scooter vs bike", "kids scooter or bike short distance", "scooter commute vs bike", "which is safer scooter bike"],
      },
      zh: {
        title: "短途通勤滑板车还是自行车",
        description: "一英里内，滑板车更轻、更便宜、更好拎；自行车更远更快。怎么按距离和孩子来选。",
        keywords: ["滑板车还是自行车", "短途儿童滑板车或自行车", "滑板车通勤vs自行车", "哪个更安全"],
      },
    },
    en: {
      title: "Scooter vs Bike for Short Trips",
      content: `For the short hops of childhood — to a friend's, to school, around the block — the choice is scooter or bike. This guide covers where each wins.

## Scooter wins the short, carry-heavy trip
Under about a mile, a scooter is lighter, cheaper, and easier to carry onto a bus or stash at a desk. It also demands less balance, so younger children manage it. A good [school-run scooter](/guides/scenario/kids-scooter-best-6-8-school) does this job well.

## Bike wins the longer, faster trip
Past a mile, a bike's gears and seated position carry a child farther with less effort and more speed. A bike also carries more, which matters for a school bag. The trade is weight, cost, and storage — see the [20 inch guide](/guides/best/kids-bike-best-20-inch).

## Safety comparison
Both need a helmet; on a scooter, [pads](/guides/risk/kids-scooter-helmet-pads) matter more because falls are hands-first. A bike's frame gives the child something to brace, which reduces some falls but adds weight in a collision. Neither is "safer" in the abstract — it depends on the route.

## Choose by distance and age
- Flat, under a mile, younger child: scooter.
- Over a mile, school bag, older child: bike.
- Unsure and the child is young: start on a scooter, move to a bike later.

## Further reading
- [Scooter for school run](/guides/scenario/kids-scooter-best-6-8-school)
- [Scooter helmet and pad set](/guides/risk/kids-scooter-helmet-pads)
- [Best 20 inch bike 7-9 years](/guides/best/kids-bike-best-20-inch)`,
    },
    zh: {
      title: "短途通勤滑板车还是自行车",
      content: `对孩子的一小段路——去朋友家、上学、绕小区——选择是滑板车或自行车。这篇讲各自在哪赢。

## 短而常拎的路程，滑板车赢
约一英里内，滑板车更轻、更便宜、更好搬上公交或塞进课桌。它也要求更少的平衡，所以更小的孩子能驾驭。一辆好的[上学通勤车](/guides/scenario/kids-scooter-best-6-8-school)干这活很好。

## 更长更快的路程，自行车赢
过一英里，自行车的变速和坐姿让孩子用更少的力走更远、更快。自行车也载得更多，对书包要紧。代价是重量、成本和存放——见[20 寸篇](/guides/best/kids-bike-best-20-inch)。

## 安全比较
两者都要头盔；滑板车上[护具](/guides/risk/kids-scooter-helmet-pads)更要紧，因为摔倒是手先着地。自行车的车架给孩子东西可撑，减少一些摔倒，但在碰撞中增加重量。抽象地说两者都不"更安全"——取决于路线。

## 按距离和年龄选
- 平路、一英里内、更小的孩子：滑板车。
- 过一英里、书包、更大的孩子：自行车。
- 不确定且孩子小：先滑板车，以后再换自行车。

## 延伸阅读
- [上学通勤滑板车](/guides/scenario/kids-scooter-best-6-8-school)
- [滑板车头盔护具套装](/guides/risk/kids-scooter-helmet-pads)
- [7–9 岁最佳 20 寸车](/guides/best/kids-bike-best-20-inch)`,
    },
  },
  {
    id: "guide-2026-rideon-12v-vs-24v",
    slug: "kids-ride-on-12v-vs-24v",
    category: "beginner",
    taxonomy: { productCategory: "electric_car", topicCategory: "beginner", topicOrder: 11 },
    seo: {
      en: {
        title: "12V vs 24V Ride On Car",
        description: "Voltage maps to age and terrain: 6V for smooth floors, 12V for grass and 3-5 year olds, 24V for older kids on bigger yards. How to choose.",
        keywords: ["12v vs 24v ride on", "ride on car voltage", "12v ride on age", "24v ride on car"],
      },
      zh: {
        title: "12V 还是 24V 儿童电动车",
        description: "电压对应年龄和地形：6V 适合光滑地面，12V 适合草地和 3–5 岁，24V 给更大孩子在更大院子。怎么选。",
        keywords: ["12v还是24v电动车", "儿童电动车电压", "12v电动车年龄", "24v电动车"],
      },
    },
    en: {
      title: "12V vs 24V Ride On Car",
      content: `Ride-on cars are sold by voltage, and the number is the single most useful spec for matching a car to a child and a yard. This guide covers what 6V, 12V, and 24V each mean in practice.

## Voltage maps to terrain and age
- **6V:** smooth indoor floors and the youngest drivers. Slowest, gentlest, shortest runtime.
- **12V:** grass, gentle slopes, and most 3-5 year olds. The common family choice — see the [best car for a 3 year old](/guides/scenario/kids-ride-on-best-3-year).
- **24V:** older children on larger yards. Faster, longer runtime, and a weight and speed level that deserves the same helmet discipline as a bike.

## What higher voltage changes
More voltage means more speed and more torque, which means it climbs grass and carries bigger kids. It also means more responsibility: a 24V car is not a toy for a two-year-old. Match the voltage to the child's age and the surface, not to the biggest number you can buy.

## Runtime is separate from voltage
Voltage is capacity to move; runtime is the battery's amp-hours and how it is driven. A 12V car with a larger battery may outrun a 24V car with a small one. Check runtime claims and read the [battery care guide](/guides/maintenance/kids-ride-on-battery-care) for keeping it.

## Parent control scales with speed
Faster cars need a [parental remote](/guides/special/kids-ride-on-parental-remote) more. If you are leaning 24V for an older child, insist on remote lockout; for a 6V toddler car it is a nicety.

## Safety and terrain
Whichever voltage, check the [weight limit](/guides/risk/kids-ride-on-weight-limit) and the tires for the surface — plastic wheels struggle on grass, and the [tire guide](/guides/category_spec/kids-ride-on-tires-grass) covers what rolls best.

## Further reading
- [Best ride on car for 3 year old](/guides/scenario/kids-ride-on-best-3-year)
- [Best 24V 2-seater ride on truck](/guides/best/kids-ride-on-best-24v-2-seater)
- [Ride on car with parental remote](/guides/special/kids-ride-on-parental-remote)
- [Ride on car tires for grass](/guides/category_spec/kids-ride-on-tires-grass)`,
    },
    zh: {
      title: "12V 还是 24V 儿童电动车",
      content: `儿童电动车按电压卖，而这个数字是把车和孩子、院子匹配起来最有用的规格。这篇讲 6V、12V、24V 在实践中各意味着什么。

## 电压对应地形和年龄
- **6V：** 光滑室内地面和最小的驾驶者。最慢、最温和、续航最短。
- **12V：** 草地、缓坡，以及大多数 3–5 岁孩子。常见的家庭选择——见[3 岁最佳车](/guides/scenario/kids-ride-on-best-3-year)。
- **24V：** 更大孩子在更大院子。更快、续航更长，是一个值得像自行车一样戴头盔的重量和速度级别。

## 更高电压改变什么
更高电压意味着更快和更大扭矩，也就是爬草、带更大孩子。它也意味着更多责任：24V 车不是两岁孩子的玩具。把电压对孩子年龄和地面，而不是买你能买到的最大数字。

## 续航与电压是两回事
电压是移动能力；续航是电池的安时和怎么开。一辆大电池的 12V 车可能比一辆小电池 24V 车跑得久。核对续航声明，[电池保养篇](/guides/maintenance/kids-ride-on-battery-care)讲怎么维持它。

## 父控随速度放大
更快的车更需要[遥控](/guides/special/kids-ride-on-parental-remote)。如果你为大孩子倾向 24V，坚持要遥控锁定；6V 幼儿车则是锦上添花。

## 安全与地形
无论哪种电压，查[承重](/guides/risk/kids-ride-on-weight-limit)和轮胎对地面的适配——塑料轮在草地上吃力，[轮胎篇](/guides/category_spec/kids-ride-on-tires-grass)讲什么滚得最好。

## 延伸阅读
- [3 岁最佳电动车](/guides/scenario/kids-ride-on-best-3-year)
- [最佳 24V 双座电动车](/guides/best/kids-ride-on-best-24v-2-seater)
- [带遥控的儿童电动车](/guides/special/kids-ride-on-parental-remote)
- [电动车轮胎草地表现](/guides/category_spec/kids-ride-on-tires-grass)`,
    },
  },
  {
    id: "guide-2026-rideon-24v-2-seater",
    slug: "kids-ride-on-best-24v-2-seater",
    category: "best",
    taxonomy: { productCategory: "electric_car", topicCategory: "best", topicOrder: 11 },
    seo: {
      en: {
        title: "Best 24V 2-Seater Ride On Truck",
        description: "A 24V two-seater carries two kids on a bigger yard. What to check: real per-seat weight limit, traction on grass, and a remote for a fast truck.",
        keywords: ["24v ride on truck", "2 seater ride on car", "24v ride on for two kids", "kids ride on truck 24v"],
      },
      zh: {
        title: "最佳 24V 双座儿童电动车",
        description: "24V 双座在大院子带两个孩子。该查什么：真实的每座承重、草地牵引，以及一辆快车该有的遥控。",
        keywords: ["24v儿童电动车", "双座儿童电动车", "24v双座带两个孩子", "儿童电动皮卡"],
      },
    },
    en: {
      title: "Best 24V 2-Seater Ride On Truck",
      content: `A 24V two-seater is the top of the ride-on ladder: enough speed and torque to carry two children across a real yard. This guide covers what to check before spending at that level.

## Two seats double the weight math
A two-seater carries two children, so the combined load approaches the car's limit fast. Check the per-seat and total [weight limit](/guides/risk/kids-ride-on-weight-limit), not just "for ages 3-8." Two five-year-olds are a different load than one.

## Traction for two riders
Loaded with two kids, a two-seater needs tires that bite. Plastic wheels spin on grass; rubber or EVA foam grips better. The [tire guide](/guides/category_spec/kids-ride-on-tires-grass) covers what rolls best. Traction matters more at 24V, where there is power to waste a wheelspin.

## Runtime under load
Two riders and a bigger motor mean shorter runtime per charge. Look for a larger battery and read the [battery care guide](/guides/maintenance/kids-ride-on-battery-care) so it lasts. A 24V truck that dies in twenty minutes becomes a push car.

## Remote is not optional at this speed
A fast, heavy truck needs a [parental remote](/guides/special/kids-ride-on-parental-remote) with a real lockout. Verify the range and that the remote overrides the child's controls.

## Single vs two seater
If you have one child, a single-seater is lighter and cheaper — the [two-seater vs single guide](/guides/special/kids-ride-on-2-seater-vs-single) weighs the choice, and the [under-$200 guide](/guides/budget/kids-ride-on-under-200) covers the budget single-seater end.

## Further reading
- [12V vs 24V ride on car](/guides/beginner/kids-ride-on-12v-vs-24v)
- [Ride on car weight limit](/guides/risk/kids-ride-on-weight-limit)
- [2-seater vs single ride on](/guides/special/kids-ride-on-2-seater-vs-single)`,
    },
    zh: {
      title: "最佳 24V 双座儿童电动车",
      content: `24V 双座是电动车阶梯的顶端：有足够速度和扭矩带两个孩子穿过真正的院子。这篇讲花到这个级别前该查什么。

## 两座让重量算式翻倍
双座带两个孩子，合并负载很快接近车的上限。核对每座和总[承重](/guides/risk/kids-ride-on-weight-limit)，不只是"适合 3–8 岁"。两个五岁孩子是一个五岁孩子的不同负载。

## 两名骑手的牵引
带两个孩子，双座需要咬得住的轮胎。塑料轮在草地上打滑；橡胶或 EVA 发泡抓地更好。[轮胎篇](/guides/category_spec/kids-ride-on-tires-grass)讲什么滚得最好。在 24V 上牵引更要紧，因为有多到能浪费在空转上的动力。

## 负载下的续航
两个骑手加更大电机意味着每次充电续航更短。找更大电池，读[电池保养篇](/guides/maintenance/kids-ride-on-battery-care)让它耐用。一辆二十分钟就没电的 24V 皮卡会变成手推车。

## 这个速度下遥控不是可选
一辆快而重的皮卡需要一个带真锁定的[遥控](/guides/special/kids-ride-on-parental-remote)。确认遥控范围，以及遥控能覆盖孩子的控制。

## 单座还是双座
如果你只有一个孩子，单座更轻更便宜——[双座 vs 单座篇](/guides/special/kids-ride-on-2-seater-vs-single)权衡这个选择，[两百美元以内篇](/guides/budget/kids-ride-on-under-200)覆盖预算单座端。

## 延伸阅读
- [12V 还是 24V 电动车](/guides/beginner/kids-ride-on-12v-vs-24v)
- [电动车承重](/guides/risk/kids-ride-on-weight-limit)
- [双座还是单座电动车](/guides/special/kids-ride-on-2-seater-vs-single)`,
    },
  },
  {
    id: "guide-2026-rideon-remote",
    slug: "kids-ride-on-parental-remote",
    category: "special",
    taxonomy: { productCategory: "electric_car", topicCategory: "special", topicOrder: 11 },
    seo: {
      en: {
        title: "Ride On Car with Parental Remote",
        description: "A parent remote lets you steer and stop a car the child cannot yet control. What to check: range, override behavior, and speed lockout.",
        keywords: ["ride on car parental remote", "kids ride on with remote", "remote control ride on car", "parent remote ride on"],
      },
      zh: {
        title: "带遥控的儿童电动车为什么重要",
        description: "家长遥控让你接管孩子还控制不了的车。该查什么：范围、覆盖行为，以及速度锁定。",
        keywords: ["儿童电动车遥控", "带遥控儿童电动车", "遥控儿童电动车", "家长遥控电动车"],
      },
    },
    en: {
      title: "Ride On Car with Parental Remote",
      content: `A parental remote is the feature that turns a ride-on from a lawn toy into something you can supervise. This guide covers what a good remote does and what to check before you rely on it.

## What the remote actually does
A remote lets the parent drive, brake, and override the child's controls. On a fast car it is the difference between a fun ride and an incident heading toward the street. It also lets a younger child enjoy a bigger car before they can steer it themselves.

## Range and reliability
Check the remote's rated range and, more importantly, whether it stays connected at the edges of the yard. A remote that drops out exactly when you need it is worse than none. Look for a rated range that comfortably exceeds your yard.

## Override, not coexistence
The remote must override the child's controls, not compete with them. When the parent takes over, the child's joystick should do nothing until the parent hands control back. Test that this is unambiguous on the listing's spec or in person.

## Speed lockout
The best remotes include a low-speed mode that caps the car regardless of what the child does. On a [12V car for a 3 year old](/guides/scenario/kids-ride-on-best-3-year) this is what makes a faster car appropriate; on a [24V truck](/guides/best/kids-ride-on-best-24v-2-seater) it is close to mandatory.

## Still required
A remote is supervision, not a substitute for it. The [weight limit](/guides/risk/kids-ride-on-weight-limit) and [battery care](/guides/maintenance/kids-ride-on-battery-care) still apply, and an adult should always be watching, not just holding a remote.

## Further reading
- [12V vs 24V ride on car](/guides/beginner/kids-ride-on-12v-vs-24v)
- [Best ride on car for 3 year old](/guides/scenario/kids-ride-on-best-3-year)
- [Best 24V 2-seater ride on truck](/guides/best/kids-ride-on-best-24v-2-seater)`,
    },
    zh: {
      title: "带遥控的儿童电动车为什么重要",
      content: `家长遥控是把电动车从草坪玩具变成你可监管的东西的特性。这篇讲好遥控做什么，以及依赖它前该查什么。

## 遥控实际做什么
遥控让家长驾驶、刹车，并覆盖孩子的控制。在快车上，它是"好玩的一趟"和"一起朝马路去的事故"的区别。它也让孩子在自己能转向前就享受更大的车。

## 范围与可靠
核对遥控的标称范围，更重要的是它在院子边缘是否仍连着。正好在需要时掉线的遥控比没有更糟。找一个标称范围明显超过你院子的。

## 覆盖，不是并存
遥控必须覆盖孩子的控制，而不是和它们竞争。家长接管时，孩子的操纵杆应无效，直到家长交还控制。在列表规格或现场确认这点不含糊。

## 速度锁定
最好的遥控含一个低速模式，无论孩子做什么都把车限速。在[3 岁的 12V 车](/guides/scenario/kids-ride-on-best-3-year)上，这是让更快的车合适的关键；在[24V 皮卡](/guides/best/kids-ride-on-best-24v-2-seater)上接近强制。

## 仍需的
遥控是监管，不替代监管。[承重](/guides/risk/kids-ride-on-weight-limit)和[电池保养](/guides/maintenance/kids-ride-on-battery-care)仍适用，且应总有大人在看，而不只是握着遥控。

## 延伸阅读
- [12V 还是 24V 电动车](/guides/beginner/kids-ride-on-12v-vs-24v)
- [3 岁最佳电动车](/guides/scenario/kids-ride-on-best-3-year)
- [最佳 24V 双座电动车](/guides/best/kids-ride-on-best-24v-2-seater)`,
    },
  },
  {
    id: "guide-2026-rideon-best-3",
    slug: "kids-ride-on-best-3-year",
    category: "scenario",
    taxonomy: { productCategory: "electric_car", topicCategory: "scenario", topicOrder: 11 },
    seo: {
      en: {
        title: "Best Ride On Car for 3 Year Old",
        description: "At three, a 6V or low 12V car with a remote is the safe pick. What to check: slow top speed, sturdy wheels for indoor and grass, and an easy stop.",
        keywords: ["ride on car for 3 year old", "best ride on 3 year old", "ride on car toddler age 3", "first ride on car"],
      },
      zh: {
        title: "3 岁最佳儿童电动车",
        description: "三岁时，一辆带遥控的 6V 或低 12V 车是安全选择。该查什么：慢的最高速度、能室内和草地跑的结实轮，以及好停。",
        keywords: ["3岁儿童电动车", "3岁最佳电动车", "3岁幼儿电动车", "第一辆电动车"],
      },
    },
    en: {
      title: "Best Ride On Car for 3 Year Old",
      content: `Three is the age most families buy a first ride-on, and it is the age where speed matters least and control matters most. This guide covers what to look for in a car a three-year-old can enjoy safely.

## Speed should be slow
A three-year-old cannot react fast enough for a quick car. Look for a low top speed — a 6V car, or a 12V in its lowest speed mode. The [voltage guide](/guides/beginner/kids-ride-on-12v-vs-24v) explains why lower is right at this age. A [parental remote](/guides/special/kids-ride-on-parental-remote) with a low-speed lockout makes the difference.

## A brake or stop the child can use
The car should stop reliably when the child lifts off and, ideally, when the parent hits the remote. A car that coasts and cannot be stopped by a three-year-old is a hazard on any slope.

## Wheels for mixed surfaces
A three-year-old drives on floors and on grass. Plastic wheels bog down on grass; EVA foam or rubber rolls both. The [tire guide](/guides/category_spec/kids-ride-on-tires-grass) covers the trade, and sturdier wheels mean the car survives the transition.

## Size and seat
The seat should hold a three-year-old with a harness and leave room to grow a little. Check the [weight limit](/guides/risk/kids-ride-on-weight-limit) rather than only the age range.

## Battery life for short rides
At this age, rides are short, so runtime is rarely the limit. Still, follow the [battery care guide](/guides/maintenance/kids-ride-on-battery-care) so the first car is still running when a sibling gets it. For a tight budget, the [under-$200 guide](/guides/budget/kids-ride-on-under-200) lists the must-haves.

## Further reading
- [12V vs 24V ride on car](/guides/beginner/kids-ride-on-12v-vs-24v)
- [Ride on car with parental remote](/guides/special/kids-ride-on-parental-remote)
- [Ride on car tires for grass](/guides/category_spec/kids-ride-on-tires-grass)
- [Best ride on car under $200](/guides/budget/kids-ride-on-under-200)`,
    },
    zh: {
      title: "3 岁最佳儿童电动车",
      content: `三岁是大多数家庭买第一辆电动车的年龄，也是速度最不要紧、控制最要紧的年龄。这篇讲一辆三岁孩子能安全享受的车该看什么。

## 速度要慢
三岁孩子的反应快不到开快车。找低最高速度的车——6V 车，或 12V 的最低速模式。[电压篇](/guides/beginner/kids-ride-on-12v-vs-24v)讲为什么这个年龄越低越好。带低速锁定的[遥控](/guides/special/kids-ride-on-parental-remote)带来关键差别。

## 孩子能用的刹车或停止
孩子松手车应可靠停下，最好家长按遥控也能停。在任何坡上，一辆滑行不停、三岁孩子停不住的车是隐患。

## 混合路面的轮子
三岁孩子在室内和草地上开。塑料轮在草地上陷；EVA 发泡或橡胶两头都滚。[轮胎篇](/guides/category_spec/kids-ride-on-tires-grass)讲这个取舍，更结实的轮意味着车扛得过过渡。

## 尺寸与座椅
座椅应能安全带住三岁孩子、还留点生长空间。核对[承重](/guides/risk/kids-ride-on-weight-limit)，而不是只看年龄范围。

## 短骑的电池
这个年龄骑得短，续航很少是限制。但仍按[电池保养篇](/guides/maintenance/kids-ride-on-battery-care)做，让第一辆车到弟弟妹妹接手时还能跑。预算紧的话，[两百美元以内篇](/guides/budget/kids-ride-on-under-200)列了必需项。

## 延伸阅读
- [12V 还是 24V 电动车](/guides/beginner/kids-ride-on-12v-vs-24v)
- [带遥控的儿童电动车](/guides/special/kids-ride-on-parental-remote)
- [电动车轮胎草地表现](/guides/category_spec/kids-ride-on-tires-grass)
- [200 美元内最佳电动车](/guides/budget/kids-ride-on-under-200)`,
    },
  },
  {
    id: "guide-2026-rideon-weight",
    slug: "kids-ride-on-weight-limit",
    category: "risk",
    taxonomy: { productCategory: "electric_car", topicCategory: "risk", topicOrder: 11 },
    seo: {
      en: {
        title: "Ride On Car Weight Limit Safety",
        description: "Overloading a ride-on strains the motor, the battery, and the brakes. What the weight limit really covers, and why two kids often exceed it.",
        keywords: ["ride on car weight limit", "ride on weight capacity", "kids ride on too heavy", "ride on car safety limit"],
      },
      zh: {
        title: "儿童电动车承重与安全须知",
        description: "超载让电动车的电机、电池和刹车都吃力。承重到底覆盖什么，以及为什么两个孩子常常超过它。",
        keywords: ["儿童电动车承重", "电动车载重", "儿童电动车太重", "电动车安全限重"],
      },
    },
    en: {
      title: "Ride On Car Weight Limit Safety",
      content: `The weight limit on a ride-on is not a suggestion; exceeding it strains the motor, drains the battery early, and lengthens the stopping distance. This guide covers what the limit covers and how to stay inside it.

## What the limit covers
The stated weight limit is the maximum rider load the car is built to carry safely at its rated speed. It is not a "recommended" figure, and it is usually for the total on the car, not per seat. A two-seater's limit is the sum of both riders — see the [two-seater guide](/guides/best/kids-ride-on-best-24v-2-seater).

## Two kids exceed limits fast
Two children approach a car's limit quickly, especially on a single-seater-sized frame. Add anything carried — a backpack, a toy — and you can exceed it without noticing. If you plan to carry two, choose the [two-seater vs single](/guides/special/kids-ride-on-2-seater-vs-single) car with the higher combined limit.

## What overloading does
- **Motor strain:** the motor runs hotter and dies sooner.
- **Battery drain:** runtime collapses because the motor works harder.
- **Braking:** the car takes longer to stop, which matters most near a street.
- **Frame:** repeated overloading loosens joints and cracks the body.

## Check the real number
Match the car's limit to the child's weight plus a margin for growth, not to the age range on the box. Weight is the spec; age is marketing. The [tire guide](/guides/category_spec/kids-ride-on-tires-grass) matters too, because a loaded car needs grip.

## Further reading
- [Best 24V 2-seater ride on truck](/guides/best/kids-ride-on-best-24v-2-seater)
- [2-seater vs single ride on](/guides/special/kids-ride-on-2-seater-vs-single)
- [Ride on car with parental remote](/guides/special/kids-ride-on-parental-remote)`,
    },
    zh: {
      title: "儿童电动车承重与安全须知",
      content: `电动车上的承重不是建议；超过它会让电机吃力、提前耗尽电池、拉长制动距离。这篇讲承重覆盖什么，以及怎么待在范围内。

## 承重覆盖什么
标称承重是车按其额定速度安全承载的最大骑手负载。它不是"建议"数字，而且通常是车上总重，不是每座。双座的限重是两个骑手之和——见[双座篇](/guides/best/kids-ride-on-best-24v-2-seater)。

## 两个孩子很快超过限重
两个孩子很快接近车的限重，尤其在单座尺寸的车架上。加上带的东西——书包、玩具——你能在不经意间超过它。如果你要带两个，选合并限重更高的[双座 vs 单座](/guides/special/kids-ride-on-2-seater-vs-single)车。

## 超载做什么
- **电机吃力：** 电机更热、更早坏。
- **电池耗尽：** 续航崩掉，因为电机更用力。
- **制动：** 车停下更久，在靠马路时最要紧。
- **车架：** 反复超载松接头、裂车身。

## 核对真数字
把车的限重对到孩子体重加一点生长余量，而不是盒子上的年龄范围。重量是规格，年龄是营销。[轮胎篇](/guides/category_spec/kids-ride-on-tires-grass)也紧要，因为载重的车需要抓地。

## 延伸阅读
- [最佳 24V 双座电动车](/guides/best/kids-ride-on-best-24v-2-seater)
- [双座还是单座电动车](/guides/special/kids-ride-on-2-seater-vs-single)
- [带遥控的儿童电动车](/guides/special/kids-ride-on-parental-remote)`,
    },
  },
  {
    id: "guide-2026-rideon-battery",
    slug: "kids-ride-on-battery-care",
    category: "maintenance",
    taxonomy: { productCategory: "electric_car", topicCategory: "maintenance", topicOrder: 11 },
    seo: {
      en: {
        title: "Charge Ride On 12V 24V Battery",
        description: "Charge after every use and store a charged battery, not a dead one. The habits that prolong a lead-acid ride-on battery, and when to replace it.",
        keywords: ["ride on car battery care", "charge ride on battery", "12v ride on battery", "ride on battery life"],
      },
      zh: {
        title: "儿童电动车 12V/24V 电池充电与保养",
        description: "每次用完就充，存放时电量充足而不是放空。延长铅酸电动车电池的习惯，以及何时更换。",
        keywords: ["电动车电池保养", "电动车充电", "12v电动车电池", "电动车电池寿命"],
      },
    },
    en: {
      title: "Charge Ride On 12V 24V Battery",
      content: `A ride-on battery is usually sealed lead-acid, and it has a few simple rules that decide whether it lasts two years or two seasons. This guide covers the habits that matter.

## Charge after every use
Do not let the battery sit discharged. Charge after each session, even if the ride was short. Leaving a lead-acid battery dead is the fastest way to kill it — sulfation sets in and capacity never fully returns.

## Store it charged, not empty
If the car is going into storage for weeks, charge it fully first and top it up every month or so. A battery stored empty is often a battery that will not hold a charge in spring. This pairs with the [winter storage guide](/guides/maintenance/kids-ride-on-winter-storage).

## Use the right charger
The voltage and connector must match. A 12V car takes a 12V charger; forcing a mismatched one damages the battery or the car. Charge in a dry, ventilated place, and let the charger finish rather than yanking it early.

## Signs it is time to replace
- Runtime collapses to a fraction of what it was.
- The car is sluggish on flat ground.
- It will not hold a charge overnight.
A replacement battery is cheaper than a new car, and the [under-$200 guide](/guides/budget/kids-ride-on-under-200) notes that battery type matters more than the sticker.

## Keep connections clean
Check the battery terminals for corrosion now and then, especially if the car lives outdoors. Clean, tight terminals deliver the voltage the motor needs.

## Further reading
- [12V vs 24V ride on car](/guides/beginner/kids-ride-on-12v-vs-24v)
- [Store ride on car for winter](/guides/maintenance/kids-ride-on-winter-storage)
- [Ride on car weight limit](/guides/risk/kids-ride-on-weight-limit)`,
    },
    zh: {
      title: "儿童电动车 12V/24V 电池充电与保养",
      content: `电动车的电池通常是密封铅酸，有几条简单规则决定它用两年还是两个季度。这篇讲要紧的习惯。

## 每次用完就充
别让电池搁在没电状态。每次玩完就充，哪怕骑得短。让铅酸电池空着是杀死它的最快方式——硫化开始，容量再也回不全。

## 存放时充满，不是放空
如果车要存几周，先充满再存，每月左右补一次。空着存的电池，往往是春天充不进电的电池。这和[冬季存放篇](/guides/maintenance/kids-ride-on-winter-storage)配套。

## 用对的充电器
电压和接口必须匹配。12V 车用 12V 充电器；硬用不匹配的会伤电池或车。在干燥通风处充，让充电器跑完，别提前拔。

## 该换的信号
- 续航崩到原来的零头。
- 平地上车也发肉。
- 放一夜存不住电。
一块换的电池比一辆新车便宜，[两百美元以内篇](/guides/budget/kids-ride-on-under-200)指出电池类型比标价更紧要。

## 保持接口干净
偶尔查电池极柱有无腐蚀，尤其是车放户外。干净、紧的极柱才给电机需要的电压。

## 延伸阅读
- [12V 还是 24V 电动车](/guides/beginner/kids-ride-on-12v-vs-24v)
- [电动车冬季存放](/guides/maintenance/kids-ride-on-winter-storage)
- [电动车承重](/guides/risk/kids-ride-on-weight-limit)`,
    },
  },
  {
    id: "guide-2026-rideon-under-200",
    slug: "kids-ride-on-under-200",
    category: "budget",
    taxonomy: { productCategory: "electric_car", topicCategory: "budget", topicOrder: 11 },
    seo: {
      en: {
        title: "Best Ride On Car Under $200",
        description: "A budget ride-on can still be safe and fun. The must-haves under $200: a working brake, a real battery, and a top speed a young rider can handle.",
        keywords: ["ride on car under 200", "cheap kids ride on", "best budget ride on car", "affordable ride on 12v"],
      },
      zh: {
        title: "200 美元以内最佳儿童电动车",
        description: "预算电动车也可以安全好玩。两百美元以内的必备项：能用的刹车、真电池，以及小骑手能应付的最高速度。",
        keywords: ["200美元电动车", "便宜儿童电动车", "性价比电动车", "平价12v电动车"],
      },
    },
    en: {
      title: "Best Ride On Car Under $200",
      content: `A low budget does not mean an unsafe ride-on. This guide covers the specs a sub-$200 car must still have, and the corner that is not worth cutting.

## Non-negotiable under $200
- **A brake or reliable stop.** The car must stop when the child lifts off, and ideally with a [parental remote](/guides/special/kids-ride-on-parental-remote).
- **A real battery and charger matched to it.** A battery type stated on the listing and a charger that fits — see the [battery care guide](/guides/maintenance/kids-ride-on-battery-care).
- **A low top speed.** For young riders, slow is the safety feature; the [voltage guide](/guides/beginner/kids-ride-on-12v-vs-24v) explains the levels.
- **A stated weight limit** the child is comfortably under — the [weight limit guide](/guides/risk/kids-ride-on-weight-limit) covers why.

## Where budget cars cut
Cheaper cars use lighter bodies, plastic wheels that struggle off smooth floors, and smaller batteries. None of these are safety failures, but plastic wheels limit the car to indoors unless the surface is flat — the [tire guide](/guides/category_spec/kids-ride-on-tires-grass) covers the upgrade.

## The right size for the budget
At this price, a single-seat 6V or 12V car is the sensible buy; a 24V two-seater is not realistic under $200. For one child, that is the right call anyway — see [two-seater vs single](/guides/special/kids-ride-on-2-seater-vs-single). A [best car for 3 year old](/guides/scenario/kids-ride-on-best-3-year) is usually in this bracket.

## Safety is not budget-dependent
Supervision and a speed cap matter more than the price tag. A budget car with a working brake, a slow speed, and an adult watching beats an expensive car used without them.

## Further reading
- [Best ride on car for 3 year old](/guides/scenario/kids-ride-on-best-3-year)
- [Ride on car with parental remote](/guides/special/kids-ride-on-parental-remote)
- [Charge ride on battery](/guides/maintenance/kids-ride-on-battery-care)`,
    },
    zh: {
      title: "200 美元以内最佳儿童电动车",
      content: `低预算不必等于不安全的电动车。这篇讲两百美元以内的车仍必须有的规格，以及不值得省的那一刀。

## 两百内不可妥协
- **能用的刹车或可靠停止。** 孩子松手车必须停，最好带[遥控](/guides/special/kids-ride-on-parental-remote)。
- **真电池和配对的充电器。** 列表上写明电池类型、充电器合身——见[电池保养篇](/guides/maintenance/kids-ride-on-battery-care)。
- **低最高速度。** 对小骑手，慢就是安全特性；[电压篇](/guides/beginner/kids-ride-on-12v-vs-24v)讲各级别。
- **标明的承重**孩子明显低于它——[承重篇](/guides/risk/kids-ride-on-weight-limit)讲为什么。

## 预算车在哪里省
更便宜的车用更轻车身、离开光滑地面就吃力的塑料轮、更小电池。这些都不是安全故障，但塑料轮把车限制在室内，除非地面平——[轮胎篇](/guides/category_spec/kids-ride-on-tires-grass)讲升级。

## 预算下选对的尺寸
这个价，单座 6V 或 12V 车是明智之选；两百美元内 24V 双座不现实。对一个孩子，这本来就是对的——见[双座 vs 单座](/guides/special/kids-ride-on-2-seater-vs-single)。一辆[3 岁最佳车](/guides/scenario/kids-ride-on-best-3-year)通常在这个档。

## 安全不随预算变
监护和限速比标价更紧要。一辆能刹、够慢、有大人在看的预算车，胜过一辆没有这些的贵车。

## 延伸阅读
- [3 岁最佳电动车](/guides/scenario/kids-ride-on-best-3-year)
- [带遥控的儿童电动车](/guides/special/kids-ride-on-parental-remote)
- [电动车电池充电保养](/guides/maintenance/kids-ride-on-battery-care)`,
    },
  },
  {
    id: "guide-2026-rideon-2-vs-1",
    slug: "kids-ride-on-2-seater-vs-single",
    category: "special",
    taxonomy: { productCategory: "electric_car", topicCategory: "special", topicOrder: 12 },
    seo: {
      en: {
        title: "2-Seater vs Single Ride On Car",
        description: "A two-seater carries two kids but drains the battery and hits the weight limit fast. A single-seater is lighter, cheaper, and lasts longer per charge.",
        keywords: ["2 seater vs single ride on", "ride on car for two kids", "two seater kids car", "single seat ride on"],
      },
      zh: {
        title: "双座还是单座儿童电动车",
        description: "双座带两个孩子，但耗电池、很快碰到承重上限。单座更轻、更便宜、每次充电跑得久。",
        keywords: ["双座还是单座电动车", "带两个孩子的电动车", "双座儿童车", "单座电动车"],
      },
    },
    en: {
      title: "2-Seater vs Single Ride On Car",
      content: `The single-versus-two-seater choice is really a question about how many children will share the car and how far it needs to go. This guide covers the trade.

## Two-seater: the shared car
A two-seater carries two children, which halves the number of rides you mediate. But it pulls double the weight, so the [weight limit](/guides/risk/kids-ride-on-weight-limit) and the [battery runtime](/guides/maintenance/kids-ride-on-battery-care) are the constraints. Two children also fight over who drives.

## Single-seater: the longer-lasting car
A single-seater is lighter, cheaper, and runs longer per charge. For one child it is the better buy; for two it means turns. It also accelerates better because it carries less.

## Weight and battery math
- **Two-seater:** near its [weight limit](/guides/risk/kids-ride-on-weight-limit) with two kids, shorter runtime, needs a bigger battery and often 24V — see the [24V two-seater guide](/guides/best/kids-ride-on-best-24v-2-seater).
- **Single-seater:** well under its limit with one child, longer runtime, often 6V or 12V.

## Which to choose
- One child: single-seater, every time.
- Two close-age kids who will share: two-seater, sized to the combined weight.
- Two kids far apart in age: start single-seater, upgrade later.

## Budget reality
Two-seaters cost more; under $200 a single-seater is the realistic option — the [under-$200 guide](/guides/budget/kids-ride-on-under-200) covers that bracket. A [remote](/guides/special/kids-ride-on-parental-remote) helps whichever you pick.

## Further reading
- [Best 24V 2-seater ride on truck](/guides/best/kids-ride-on-best-24v-2-seater)
- [Ride on car weight limit](/guides/risk/kids-ride-on-weight-limit)
- [Best ride on car under $200](/guides/budget/kids-ride-on-under-200)`,
    },
    zh: {
      title: "双座还是单座儿童电动车",
      content: `单座还是双座，真正的问题是有几个孩子要共享这辆车、它要跑多远。这篇讲这个取舍。

## 双座：共享的车
双座带两个孩子，把你要调解的"谁先骑"次数减半。但它拉双倍重量，所以[承重](/guides/risk/kids-ride-on-weight-limit)和[续航](/guides/maintenance/kids-ride-on-battery-care)是约束。两个孩子还会争谁开。

## 单座：更耐用的车
单座更轻、更便宜、每次充电跑得久。对一个孩子它更好；对两个就意味着轮流。它加速也更好，因为载得少。

## 重量与电池算式
- **双座：** 带两个孩子接近其[承重](/guides/risk/kids-ride-on-weight-limit)，续航更短，需要更大电池、常是 24V——见[24V 双座篇](/guides/best/kids-ride-on-best-24v-2-seater)。
- **单座：** 带一个孩子远低于限重，续航更长，常是 6V 或 12V。

## 怎么选
- 一个孩子：永远单座。
- 两个年龄接近、会共享的孩子：双座，按合并重量选尺寸。
- 两个年龄差得远的孩子：先单座，以后升级。

## 预算现实
双座更贵；两百美元内单座才是现实选项——[两百美元以内篇](/guides/budget/kids-ride-on-under-200)覆盖这个档。无论选哪个，[遥控](/guides/special/kids-ride-on-parental-remote)都有帮助。

## 延伸阅读
- [最佳 24V 双座电动车](/guides/best/kids-ride-on-best-24v-2-seater)
- [电动车承重](/guides/risk/kids-ride-on-weight-limit)
- [200 美元内最佳电动车](/guides/budget/kids-ride-on-under-200)`,
    },
  },
  {
    id: "guide-2026-rideon-tires",
    slug: "kids-ride-on-tires-grass",
    category: "category_spec",
    taxonomy: { productCategory: "electric_car", topicCategory: "category_spec", topicOrder: 11 },
    seo: {
      en: {
        title: "Ride On Car Tires for Grass",
        description: "Plastic wheels spin on grass; rubber and EVA foam grip. How tire type decides where a ride-on can actually drive, and what to check for your yard.",
        keywords: ["ride on car tires grass", "ride on rubber vs plastic wheels", "ride on eva foam tires", "ride on car off road"],
      },
      zh: {
        title: "儿童电动车轮胎草地表现",
        description: "塑料轮在草地上打滑；橡胶和 EVA 发泡抓地。轮胎类型怎么决定电动车真能在哪开，以及该为你的院子查什么。",
        keywords: ["电动车轮胎草地", "电动车橡胶vs塑料轮", "电动车eva发泡胎", "电动车越野"],
      },
    },
    en: {
      title: "Ride On Car Tires for Grass",
      content: `The tires decide where a ride-on can actually drive, more than the motor or the voltage. This guide covers the three tire types and what each does on grass.

## Plastic wheels: indoor only, mostly
Hard plastic wheels grip smooth floors and spin on soft ground. A plastic-wheeled car is fine on pavement and driveway; on grass it digs in and stops. If your child will mostly be outdoors, plastic is the limiting factor.

## EVA foam: the middle
Foam wheels grip better than plastic, never go flat, and roll on grass and pavement. They are the sweet spot for a family that mixes surfaces, and they need no maintenance.

## Rubber: the grass answer
Rubber tires with a real tread grip grass, mulch, and gentle slopes the others cannot. They are heavier and cost more, but they are what you want if the car lives on a lawn. On a [loaded two-seater](/guides/best/kids-ride-on-best-24v-2-seater), rubber traction matters even more.

## Match tires to your yard
- **Mostly indoors / smooth floors:** plastic is fine.
- **Mixed pavement and grass:** EVA foam.
- **Mostly lawn, slopes, or gravel:** rubber.
Whatever you choose, the [weight limit](/guides/risk/kids-ride-on-weight-limit) still applies — a loaded car needs grip.

## Grip and braking
Tire type also changes stopping. Plastic on grass slides; rubber bites. If the car sees any slope, the tire is part of the brake. Keep the wheels clean and the tread intact; a worn tire loses exactly the grip you bought it for.

## Further reading
- [12V vs 24V ride on car](/guides/beginner/kids-ride-on-12v-vs-24v)
- [Best 24V 2-seater ride on truck](/guides/best/kids-ride-on-best-24v-2-seater)
- [Best ride on car for 3 year old](/guides/scenario/kids-ride-on-best-3-year)`,
    },
    zh: {
      title: "儿童电动车轮胎草地表现",
      content: `轮胎比电机或电压更决定电动车真能在哪开。这篇讲三种轮胎类型，以及各自在草地上如何。

## 塑料轮：基本只室内
硬塑料轮在光滑地面抓地、在软地上打滑。塑料轮的车在铺装和车道上没问题；草地上它陷进去就停。如果你的孩子大多在户外，塑料是限制因素。

## EVA 发泡：中间档
发泡轮比塑料抓地、永不瘪、在草地和铺装都滚。它是混用路面家庭的甜点，且无需保养。

## 橡胶：草地的答案
带真胎面的橡胶胎抓草地、覆盖物和其他两者过不去的缓坡。它更重更贵，但如果车活在草坪上，正是你要的。在[载重的双座](/guides/best/kids-ride-on-best-24v-2-seater)上，橡胶牵引更要紧。

## 按院子配轮胎
- **基本室内/光滑地面：** 塑料可以。
- **铺装草地混合：** EVA 发泡。
- **基本草坪、坡道或碎石：** 橡胶。
无论选哪种，[承重](/guides/risk/kids-ride-on-weight-limit)仍适用——载重的车需要抓地。

## 抓地与制动
轮胎类型也改变停下。草地上塑料打滑，橡胶咬。如果车经过任何坡，轮胎就是刹车的一部分。保持轮子干净、胎面完好；磨平的胎正好丢掉你买它时要的抓地。

## 延伸阅读
- [12V 还是 24V 电动车](/guides/beginner/kids-ride-on-12v-vs-24v)
- [最佳 24V 双座电动车](/guides/best/kids-ride-on-best-24v-2-seater)
- [3 岁最佳电动车](/guides/scenario/kids-ride-on-best-3-year)`,
    },
  },
  {
    id: "guide-2026-rideon-winter",
    slug: "kids-ride-on-winter-storage",
    category: "maintenance",
    taxonomy: { productCategory: "electric_car", topicCategory: "maintenance", topicOrder: 12 },
    seo: {
      en: {
        title: "Store Ride On Car for Winter",
        description: "Cold kills ride-on batteries stored empty. How to put a car away for winter and bring it back in spring: charge, store indoors, and top up monthly.",
        keywords: ["ride on car winter storage", "store ride on battery winter", "ride on car off season", "kids car battery winter"],
      },
      zh: {
        title: "儿童电动车冬季存放与电池保养",
        description: "低温加空电存放会杀死电动车电池。怎么把车收起来过冬、春天再拿出来：充满、室内存、每月补电。",
        keywords: ["电动车冬季存放", "电动车电池过冬", "电动车淡季存放", "儿童车电池冬天"],
      },
    },
    en: {
      title: "Store Ride On Car for Winter",
      content: `Winter is the season most ride-on batteries die — not from the cold alone, but from being stored empty. This guide covers how to put a car away and bring it back.

## Charge fully before storing
Never store the car dead. Charge the battery to full, then charge it again every month or so while it sits. A lead-acid battery left empty sulfates and loses capacity permanently — this is the single biggest storage mistake. The [battery care guide](/guides/maintenance/kids-ride-on-battery-care) covers the details.

## Store it indoors if you can
A garage or shed beats outdoors. Cold and moisture corrode terminals and shorten battery life. If it must stay outside, at least bring the battery indoors and keep the car covered and off the ground.

## Do the pre-storage checks
- Wipe the car down and dry the wheels and body.
- Disconnect or remove the battery if storing indoors anyway.
- Check the tires and, on a rubber-tired car, note any wear to replace in spring — see the [tire guide](/guides/category_spec/kids-ride-on-tires-grass).

## Bringing it back in spring
Charge it fully before the first spring ride. If it will not hold a charge, the battery is the likely culprit and is replaceable — cheaper than a new car, as the [under-$200 guide](/guides/budget/kids-ride-on-under-200) notes.

## One more thing
While it is stored, confirm the car still suits the child's size and weight for the coming season; the [weight limit guide](/guides/risk/kids-ride-on-weight-limit) is the number to check before a bigger kid climbs in.

## Further reading
- [Charge ride on 12V 24V battery](/guides/maintenance/kids-ride-on-battery-care)
- [Ride on car tires for grass](/guides/category_spec/kids-ride-on-tires-grass)
- [Best ride on car under $200](/guides/budget/kids-ride-on-under-200)`,
    },
    zh: {
      title: "儿童电动车冬季存放与电池保养",
      content: `冬天是大多数电动车电池死掉的季节——不是单因为冷，而是空着存放。这篇讲怎么把车收起来、春天再拿出来。

## 存放前充满
绝不放空存放。把电池充满，然后放着时每月左右再充一次。铅酸电池空着会硫化、永久损失容量——这是最大的存放错误。[电池保养篇](/guides/maintenance/kids-ride-on-battery-care)讲细节。

## 能放室内就放室内
车库或棚子胜过户外。冷和湿腐蚀极柱、缩短电池寿命。如果必须留在外面，至少把电池搬进屋，车罩好、离地。

## 存放前检查
- 擦干车、擦干轮子和车身。
- 反正进屋存的话，断开或取出电池。
- 查轮胎，橡胶胎的车记下磨损春天换——见[轮胎篇](/guides/category_spec/kids-ride-on-tires-grass)。

## 春天拿出来
第一次春骑前充满。如果存不住电，多半是电池，且可换——比新车便宜，[两百美元以内篇](/guides/budget/kids-ride-on-under-200)指出过。

## 还有一件事
存放时，确认车来季仍适合孩子的尺寸和重量；更大的孩子爬进去前，[承重篇](/guides/risk/kids-ride-on-weight-limit)是该核对的数字。

## 延伸阅读
- [电动车电池充电保养](/guides/maintenance/kids-ride-on-battery-care)
- [电动车轮胎草地表现](/guides/category_spec/kids-ride-on-tires-grass)
- [200 美元内最佳电动车](/guides/budget/kids-ride-on-under-200)`,
    },
  },
];

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const problems = [];
const fail = (id, msg) => problems.push(`${id}: ${msg}`);

const checkText = (id, field, text, { maxDesc } = {}) => {
  const value = String(text || "");
  if (!value.trim()) return fail(id, `${field} is empty`);
  const lower = value.toLowerCase();
  for (const phrase of FORBIDDEN_PHRASES) {
    if (value.includes(phrase) || lower.includes(phrase.toLowerCase())) {
      fail(id, `${field} contains forbidden claim phrase "${phrase}"`);
    }
  }
  if (textHas(FORBIDDEN_MEDICAL, value)) {
    fail(id, `${field} contains a forbidden medical-claim pattern`);
  }
  if (maxDesc && value.length > maxDesc) {
    fail(id, `${field} is ${value.length} chars > ${maxDesc}`);
  }
};

const checkSeo = (id, seo) => {
  for (const lang of ["en", "zh"]) {
    const s = seo?.[lang];
    if (!s) return fail(id, `seo.${lang} missing`);
    const title = String(s.title || "").trim();
    const desc = String(s.description || "").trim();
    if (!title) fail(id, `seo.${lang}.title empty`);
    if (!desc) fail(id, `seo.${lang}.description empty`);
    if (Array.isArray(s.keywords) && s.keywords.length > 5) {
      fail(id, `seo.${lang}.keywords has ${s.keywords.length} entries > 5`);
    }
    checkText(id, `seo.${lang}.title`, title, {});
    checkText(id, `seo.${lang}.description`, desc, { maxDesc: 155 });
    if (lang === "en") {
      const full = `${title} | BalanceBikeToddler`;
      if (full.length > 65) fail(id, `EN title + suffix = ${full.length} > 65`);
      if (title.length > 44) fail(id, `EN title base ${title.length} > 44`);
    }
  }
};

// The repo's check-prerender-content.mjs enforces MIN_TEXT_CHARS = 800 on the
// rendered guide page (which includes site chrome), so ~800 visible chars is
// the hard floor. We hold ourselves to a higher, SEO-sane bar here.
const BODY_MIN_EN = 1100;
const BODY_MIN_ZH = 550;
const checkBody = (id, en, zh) => {
  for (const [lang, obj, min] of [["en", en, BODY_MIN_EN], ["zh", zh, BODY_MIN_ZH]]) {
    if (!obj?.title?.trim()) fail(id, `${lang}.title empty`);
    if (!obj?.content?.trim()) fail(id, `${lang}.content empty`);
    if (String(obj?.content || "").length < min) {
      fail(id, `${lang}.content is only ${String(obj?.content || "").length} chars < ${min} — too thin`);
    }
    checkText(id, `${lang}.title`, obj?.title, {});
    checkText(id, `${lang}.content`, obj?.content, {});
  }
};

for (const g of GUIDES) {
  if (!/^guide-[a-z0-9-]+$/.test(g.id)) fail(g.id, "id format");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(g.slug)) fail(g.id, `slug "${g.slug}" not URL-safe`);
  checkSeo(g.id, g.seo);
  checkBody(g.id, g.en, g.zh);
  if (String(g.en.title).trim() !== String(g.seo.en.title).trim()) {
    fail(g.id, "en.title and seo.en.title differ (prerender reads en.title for the <title> stem)");
  }
  if (String(g.zh.title).trim() !== String(g.seo.zh.title).trim()) {
    fail(g.id, "zh.title and seo.zh.title differ");
  }
}

// Duplicate-slug guard against what is already live. Our own re-applies are
// idempotent upserts, so a live slug that is also one of our GUIDES slugs is
// expected and skipped; only a live slug owned by someone else should fail.
const ownSlugs = new Set(GUIDES.map((g) => String(g.slug || "").trim().toLowerCase()));
const taken = new Set();
for (const collection of ["guides", "news"]) {
  try {
    const res = await fetch(`${API_BASE}/api/cms/${collection}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();
    for (const row of rows?.data || []) taken.add(`${collection}:${String(row.slug || "").trim().toLowerCase()}`);
  } catch (error) {
    console.error(`[warn] could not list live ${collection} for slug-collision check: ${error.message}`);
  }
}
for (const item of GUIDES) {
  if (taken.has(`guides:${item.slug.toLowerCase()}`) && !ownSlugs.has(item.slug.toLowerCase())) {
    fail(item.id, `slug "${item.slug}" already exists live in guides (owned by another record)`);
  }
}
// Intra-batch duplicate slugs.
const seenSlugs = new Map();
for (const item of GUIDES) {
  const s = item.slug.toLowerCase();
  if (seenSlugs.has(s)) fail(item.id, `slug "${item.slug}" duplicates ${seenSlugs.get(s)} within this batch`);
  seenSlugs.set(s, item.id);
}

console.log(`Validation: ${problems.length} problem(s)`);
for (const p of problems) console.error(`  - ${p}`);
if (problems.length > 0) process.exit(1);

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------
async function post(collection, payload) {
  const res = await fetch(`${API_BASE}/api/cms/${collection}/save`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-cms-admin-token": TOKEN,
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} ${text.slice(0, 200)}`);
  let parsed = {};
  try {
    parsed = JSON.parse(text);
  } catch {
    /* non-JSON */
  }
  return { saved: Boolean(parsed?.data?.saved), raw: text.slice(0, 160) };
}

async function main() {
  if (!TOKEN) {
    console.error("CMS_ADMIN_ALL_TOKEN is required.");
    process.exit(1);
  }
  const guides = GUIDES.map((g) => ({
    ...g,
    status: STATUS,
    updatedAt: new Date().toISOString(),
    taxonomy: {
      ...g.taxonomy,
      hub: "all_guides",
      hierarchyPath: [g.taxonomy.productCategory, "all_guides", g.taxonomy.topicCategory],
    },
  }));

  console.log(`API base: ${API_BASE}`);
  console.log(`Mode: ${APPLY ? `APPLY (writing to D1, status=${STATUS})` : "DRY RUN"}`);
  console.log(`Guides: ${guides.length}`);
  if (!APPLY) {
    console.log("\nDry run complete. Re-run with --apply to write.");
    return;
  }

  let ok = 0;
  let failed = 0;
  for (const item of guides) {
    try {
      const result = await post("guides", item);
      if (result.saved) {
        ok += 1;
        console.log(`[ok] guides/${item.slug}`);
      } else {
        failed += 1;
        console.error(`[?] guides/${item.slug} — response: ${result.raw}`);
      }
    } catch (error) {
      failed += 1;
      console.error(`[FAILED] guides/${item.slug}: ${error.message}`);
    }
  }
  console.log(`\nDone: ${ok} saved, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
