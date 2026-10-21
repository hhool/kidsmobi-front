#!/usr/bin/env node
/**
 * Write the 10 planned articles (6 guides + 4 news) into the production CMS.
 *
 * Source of truth: doc/article-plan-10-2026-10-19_{zh,en}.md. Every payload
 * below carries the plan's title / slug / description / keywords, plus the
 * full bilingual body drafted against the plan's honesty constraints:
 *   - only manufacturer-published specs and real, linkable publications;
 *   - no testing claims (the site performs none);
 *   - zero medical claims (G6 stays on physical fit);
 *   - N8's standard status verified against 2026 public reporting.
 *
 * Pre-write validation (fails before anything is sent):
 *   - EN title base <= 44 chars (+ " | BalanceBikeToddler" = <= 65);
 *   - EN/ZH description <= 155 chars;
 *   - keywords <= 5 per language;
 *   - no forbidden claim phrase in any text field.
 *
 * Usage:
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/write-10-articles.mjs --dry-run
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/write-10-articles.mjs --apply
 *
 * Environment:
 *   CMS_API_BASE   default https://store.balancebiketoddler.com
 */

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const API_BASE = (process.env.CMS_API_BASE || "https://store.balancebiketoddler.com").replace(/\/+$/, "");
const TOKEN = String(process.env.CMS_ADMIN_ALL_TOKEN || "").trim();
const PUBLISHED_AT = "2026-10-19T15:05:00.000Z";

// ---------------------------------------------------------------------------
// Honesty pre-scan. Mirrors the phrases check-honesty-claims.ts guards
// (subset sufficient for authored copy — the full guard runs on dist anyway).
// ---------------------------------------------------------------------------
// Enforcement data — not published copy. The diff-review honesty-claim rule
// skips the marked region so the ban list does not flag its own vocabulary;
// every payload string below the markers stays fully checked.
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
    id: "guide-2026-price-tiers",
    slug: "balance-bike-price-tiers",
    category: "budget",
    taxonomy: { productCategory: "balance", hub: "all_guides", topicCategory: "budget", topicOrder: 1 },
    seo: {
      en: {
        title: "Balance Bike Price Tiers: What Each Buys",
        description:
          "What $50, $100 and $200 actually buy in a balance bike — frame, tire and weight trade-offs at each tier, and the checks that separate a keeper from a dud.",
        keywords: ["balance bike price", "cheap balance bike", "budget balance bike", "is a balance bike worth it"],
      },
      zh: {
        title: "平衡车价格档位：各档实际买到什么",
        description:
          "50/100/200 美元档位各买到什么：车架、轮胎与重量的真实取舍，以及区分值得留与该避开的检查项。",
        keywords: ["平衡车价格", "便宜平衡车", "预算平衡车", "平衡车值得买吗"],
      },
    },
    en: {
      title: "Balance Bike Price Tiers: What Each Buys",
      content: `Balance bikes span roughly $30 to $150, and the price gap buys three things: frame material, wheel type, and adjustment range. This guide breaks down what each tier actually delivers, using manufacturer-published specifications — and what no tier can fix, because fit beats price every time.

## What the three tiers look like in published specs

Across current listings, balance bikes cluster into three price bands. The numbers below come from manufacturer specification sheets and retailer listings, not from any testing of our own.

- **Budget band (about $30–$60)**: carbon steel or steel frames, published weights from about 3.3 to 7.8 lb (1.5–3.5 kg), foam or basic pneumatic wheels, and a narrower seat-height range.
- **Mid band (about $60–$110)**: still mostly steel frames, but with longer seat ranges, 12-inch wheels becoming standard, and published weights around 4 to 8 lb.
- **Upper band (about $110–$150)**: aluminum or alloy frames, the longest adjustment ranges, and published weights around 5 to 7 lb — the lightest bikes in the field sit here.

## What the money actually buys

### 1. Frame material

Steel frames are heavier per square inch but stiff and inexpensive. Aluminum and alloy frames save weight at a higher cost. Composite frames — new to the balance bike market in 2026 — sit between the two: light like aluminum, but with long-term durability data still being collected. For a first bike that will be handed to a sibling, the material question is really "how many kids will ride this?"

### 2. Wheel type and size

Foam (EVA) wheels never go flat and need no maintenance; they also grip less on wet or smooth surfaces. Pneumatic wheels absorb more road buzz and hold better through turns, but they need inflation and can go flat. Most bikes in every band now ship 12-inch wheels; smaller 6–8 inch wheels appear mainly in the budget band and suit younger, lighter riders.

### 3. Adjustment range

This is the most underrated spec on the sheet. A seat that adjusts from 11 to 17 inches can serve a child from their first stride to their transition to a pedal bike. Budget bikes often stop at 11–13 inches, which limits useful life to about a year. Check the seat range against your child's inseam today, not against their age.

## What price does not buy

Fit is not a premium feature. A $35 bike with the right seat height will teach balance better than a $150 bike that is too tall, because the rider's feet must reach the ground with a slight knee bend.

Safety standards apply at every price point. CPSIA chemical limits and tracking labels are mandatory for all children's products in the US, and a $30 bike is subject to the same rules as a $150 one. A permanent minimum-insertion mark on the seat post is required on every bike — check that it is visible, not painted over.

## The keeper-or-dud checklist

Work through these checks against the listing or in the store, at any price:

1. **Inseam to seat height**: the lowest seat position should sit at or just below your child's inseam, with the handlebars reachable without leaning.
2. **Frame weight**: a commonly used rule of thumb is that the bike should weigh no more than about a third of the rider's weight, so the child can lift and steer it themselves.
3. **Wheel type match**: foam for zero maintenance, pneumatic for grip — pick the trade-off you want to live with.
4. **Adjustment range**: the top of the seat range should carry the bike through at least a year of growth.
5. **Compliance basics**: a tracking label with manufacturer, date, and batch; a visible minimum-insertion mark on the seat post; and a Children's Product Certificate available from the seller.

## Where to go deeper

For the full budget analysis — what a $50 bike compromises, which specs survive at every price, and how to read a listing's spec sheet — see our [budget balance bike guide](/balance-bike-budget/).`,
    },
    zh: {
      title: "平衡车价格档位：各档实际买到什么",
      content: `平衡车的价格大致从 30 美元跨到 150 美元，差价主要买到三样东西：车架材质、轮胎类型和可调节范围。本文按厂商公开规格拆解各档位实际能买到什么，以及哪件事是任何档位都解决不了的——因为适配永远比价格重要。

## 三个档位在公开规格里的样子

综合当前在售款式，平衡车大致聚成三个价格带。下面的数字来自厂商规格表与零售页面，不是我们自己的测量。

- **入门带（约 30–60 美元）**：碳钢或钢架，公开重量约 3.3–7.8 磅（1.5–3.5 公斤），发泡或基础充气轮胎，座高调节范围较窄。
- **中档带（约 60–110 美元）**：仍以钢架为主，但座高范围更长，12 寸轮成为标配，公开重量约 4–8 磅。
- **高端带（约 110–150 美元）**：铝合金或合金车架，调节范围最大，公开重量约 5–7 磅——市面上最轻的几款都在这一带。

## 钱实际买到了什么

### 1. 车架材质

钢架单位重量更重，但刚度好、成本低。铝或合金车架以更高成本换取更轻的重量。复合材质车架 2026 年才进入平衡车市场，性能介于两者之间：像铝一样轻，但长期耐久数据还在积累中。如果第一辆车以后要传给第二个孩子，材质问题实际上是"这辆车要给几个孩子骑"。

### 2. 轮胎类型与尺寸

发泡（EVA）轮永不漏气、免维护，代价是湿滑路面抓地力较弱。充气胎吸收更多路面颠簸、过弯抓地更好，但需要打气、可能被扎。目前各档位大多标配 12 寸轮；6–8 寸小轮主要出现在入门带，适合更小更轻的骑手。

### 3. 调节范围

这是规格表上最被低估的一项。座高能从 11 寸调到 17 寸的车，可以陪孩子从第一次滑行骑到过渡到脚踏车。入门车往往只到 11–13 寸，有效使用期大约只有一年。请对照孩子当前的腿长（inseam）看座高范围，而不是看年龄。

## 价格买不到的东西

适配不是付费功能。一辆座高合适的 35 美元车，比一辆太高、脚够不到地的 150 美元车更能教会平衡。

安全标准在每个价位都一视同仁。美国的 CPSIA 化学限值和追溯标签对所有儿童产品强制适用，30 美元的车和 150 美元的车受同一套规则约束。座管上的永久性最小插入深度标记是每辆车都必须有的——检查它清晰可见，没有被漆盖住。

## 值得留还是该避开：检查清单

任何价位，下单前对照清单逐项过：

1. **腿长对座高**：最低座位应落在孩子腿长处或略低，且不前倾就能扶到车把。
2. **车重**：一个常用经验法则是车重不超过骑手体重的约三分之一，孩子才搬得动、扶得正。
3. **轮胎匹配**：发泡免维护、充气抓地好——选一个你愿意接受的取舍。
4. **调节范围**：座高上限至少要撑过一年的成长。
5. **合规基础件**：带厂商、日期、批次的追溯标签；清晰可见的座管最小插入标记；可向卖家索取的儿童产品证书（CPC）。

## 延伸阅读

完整的预算分析——50 美元的车妥协了什么、哪些规格在所有价位都存活、怎么看懂在售页面的规格表——见我们的[预算平衡车指南](/balance-bike-budget/)。`,
    },
  },
  {
    id: "guide-2026-vs-training-wheels",
    slug: "balance-bike-vs-training-wheels",
    category: "beginner",
    taxonomy: { productCategory: "balance", hub: "all_guides", topicCategory: "beginner", topicOrder: 4 },
    seo: {
      en: {
        title: "Balance Bike vs Training Wheels: What Wins",
        description:
          "Balance bike or training wheels? What published research and parent reports say about which teaches balance faster, and when each one still makes sense.",
        keywords: ["balance bike vs training wheels", "do balance bikes work", "training wheels age"],
      },
      zh: {
        title: "平衡车 vs 训练轮：到底哪个好",
        description:
          "平衡车还是训练轮？已发表研究与家长反馈怎么说，以及各自真正适用的场景。",
        keywords: ["平衡车对比训练轮", "平衡车有用吗", "训练轮年龄"],
      },
    },
    en: {
      title: "Balance Bike vs Training Wheels: What Wins",
      content: `The short answer: balance bikes tend to get children riding independently sooner, and the best available evidence points that way — but the evidence comes from a small number of studies with real limitations, and fit matters more than either tool. Here is what the research actually says, and where training wheels still make sense.

## What the studies measured

Two peer-reviewed studies from the same Portuguese research group dominate the English-language literature on this question, and both compared balance bikes against bicycles with training wheels.

The first, [published in 2022 in the International Journal of Environmental Research and Public Health](https://www.mdpi.com/1660-4601/19/3/1814), surveyed 2,005 parents in Portugal. Children whose first bike was a balance bike learned to cycle independently at an average age of 4.16 years, versus 5.97 years for training wheels and 7.27 years for starting directly on a pedal bike. The differences were statistically significant, and the authors concluded the balance bike should come first in the learning process.

The second, [published in 2025 in the Journal of Functional Morphology and Kinesiology](https://www.mdpi.com/2411-5142/10/1/53), ran an actual intervention: 50 children who could not yet cycle were split into two groups, spent six sessions on either a balance bike or a bike with training wheels, then moved to a conventional bike. Independent-cycling success was 100% in the balance-bike group versus about 77% in the training-wheels group, and the balance-bike group learned each milestone — self-launch, riding, braking — faster.

## The limitations, stated plainly

Both studies have constraints that matter when you read those numbers:

- The 2022 study is a parent-reported online survey, not a controlled trial. Families choose their own tools, so more cycling-involved households may be over-represented.
- The 2025 study is small — 50 children, all from one region — and peer reviewers specifically questioned whether its groups were equivalent at baseline and whether the sample could support its conclusions about body composition.
- Neither study measured long-term riding skill, safety, or enjoyment. They measured how quickly children reached independent cycling.
- The literature is young and concentrated in a handful of research groups. This is not a settled question.

"Balance bikes get children riding sooner" is a defensible summary of the current evidence. "Balance bikes are proven better in every way" is not.

## Fit decides more than the tool

Neither bike teaches anything if the rider cannot reach the ground. Match the seat height to your child's inseam — the lowest seat position should sit at or just below the inseam, with a slight knee bend at the ground — before comparing approaches. Our [balance bike by age](/balance-bike-by-age/) guide walks through the measurement, and the [balance bike size chart](/balance-bike-size-chart/) shows published seat ranges across current models.

Training wheels also introduce a specific fit problem: they raise the effective ride height and tilt the bike, which changes the geometry the child is learning on.

## When training wheels still make sense

- **Hand-me-down reality**: if a pedal bike with training wheels is already in the garage, it will still get a child riding — just later, and with a wobblier base.
- **Older starters**: a 5-year-old who has never ridden may tolerate the "big kid bike" framing of training wheels better than starting on a toddler-sized balance bike.
- **Transition aid**: some families use the balance bike first, then training wheels on the pedal bike, then remove the wheels. The research supports starting with the balance bike, not skipping it.

## A realistic timeline

The 2022 survey puts average independent-cycling age at just over four years for balance-bike starters — but that is an average across thousands of families, not a schedule. Children who start striding around 18–24 months typically ride a pedal bike somewhere between 3 and 5 years, depending on practice time, terrain, and temperament. Any product or program that promises a specific number of weeks is selling you something.

## The bottom line

Start with a balance bike that fits, ride it often on safe ground, and move to a pedal bike when the child can glide confidently with feet up. Training wheels are a fallback, not a failure — but the evidence says the balance-bike route is the faster one.`,
    },
    zh: {
      title: "平衡车 vs 训练轮：到底哪个好",
      content: `简短回答：平衡车通常让孩子更早学会独立骑行，现有最好的证据也指向这个方向——但这些证据来自少数几项研究，且各有真实局限；而且适配比选哪种工具都重要。下面是研究实际说了什么，以及训练轮仍然有意义的场景。

## 研究测了什么

英文文献里主导这个问题的是同一支葡萄牙研究团队的两项同行评审研究，都对比了平衡车与带训练轮的自行车。

第一篇[2022 年发表于《国际环境研究与公共卫生杂志》](https://www.mdpi.com/1660-4601/19/3/1814)，调查了葡萄牙 2005 名家长。第一辆车是平衡车的孩子，独立骑行的平均年龄为 4.16 岁；从训练轮起步的为 5.97 岁；直接上脚踏车的为 7.27 岁。差异具有统计显著性，作者结论是平衡车应放在学习过程的最前面。

第二篇[2025 年发表于《功能形态学与运动学杂志》](https://www.mdpi.com/2411-5142/10/1/53)，是一项真实干预实验：50 名还不会骑车的孩子分成两组，分别用平衡车或带训练轮的车练习六个课时，再转到普通自行车。独立骑行成功率在平衡车组为 100%，训练轮组约 77%；平衡车组在每个里程碑——自主起步、骑行、刹车——上都学得更快。

## 局限要说清楚

读这些数字时，两项研究的约束都很重要：

- 2022 年研究是家长自报的在线问卷，不是对照实验。家庭自己选择工具，骑行参与度高的家庭可能占比偏高。
- 2025 年研究样本很小——50 名孩子，全部来自同一地区——同行评审人明确质疑过两组起点的等价性，以及样本能否支撑其关于身体构成的结论。
- 两项研究都没有测量长期骑行技能、安全或乐趣，测的是达到独立骑行的速度。
- 文献很年轻，且集中在少数研究团队。这不是一个已经有定论的问题。

"平衡车让孩子更早学会骑车"是对现有证据站得住的概括。"平衡车被证明全面更优"不是。

## 适配比工具更决定结果

如果骑手脚够不到地，哪种车都教不了东西。先对照孩子腿长调座高——最低座位应落在腿长处或略低、坐着时膝盖微弯——再比较路线。我们的[平衡车按年龄选](/balance-bike-by-age/)指南讲测量方法，[平衡车尺码表](/balance-bike-size-chart/)列出现役款式的座高范围。

训练轮还有一个特定的适配问题：它抬高了有效骑行高度并让车倾斜，改变了孩子学习时依据的几何关系。

## 训练轮仍然有意义的场景

- **现实传承**：如果车库里已经有一辆带训练轮的脚踏车，它照样能让孩子学会骑——只是更晚，且基础更晃。
- **起步更晚**：从没骑过车的 5 岁孩子，可能更能接受训练轮的"大孩子车"叙事，而不是从一辆幼儿尺寸的平衡车开始。
- **过渡辅助**：有些家庭先平衡车、再在脚踏车上装训练轮、最后拆轮。研究支持的是从平衡车开始，而不是跳过它。

## 一个现实的时间线

2022 年调查中，平衡车起步者的独立骑行平均年龄刚过 4 岁——但这是数千家庭的均值，不是时刻表。18–24 个月开始滑行的孩子，通常在 3 到 5 岁之间的某个时点骑上脚踏车，取决于练习时间、场地和性格。任何承诺具体周数的产品或课程，都在卖你东西。

## 结论

从一辆合适的平衡车开始，在安全地面上多骑，等孩子能双脚离地自信滑行时再上脚踏车。训练轮是退而求其次的选择，不是失败——但证据表明平衡车路线更快。`,
    },
  },
  {
    id: "guide-2026-where-to-ride",
    slug: "where-to-ride-balance-bike",
    category: "scenario",
    taxonomy: { productCategory: "balance", hub: "all_guides", topicCategory: "scenario", topicOrder: 1 },
    seo: {
      en: {
        title: "Where to Ride a Balance Bike: Terrain Guide",
        description:
          "Pavement, parks, grass, gravel or indoors: how each surface changes what matters in a balance bike, from tire type to frame weight.",
        keywords: ["where to ride balance bike", "balance bike terrain", "balance bike tires pavement grass"],
      },
      zh: {
        title: "平衡车在哪里骑：地形指南",
        description:
          "人行道、公园、草地、砾石或室内：不同路面如何改变平衡车的轮胎与重量取舍。",
        keywords: ["平衡车在哪里骑", "平衡车地形", "平衡车轮胎"],
      },
    },
    en: {
      title: "Where to Ride a Balance Bike: Terrain Guide",
      content: `A balance bike is a surface-sensitive machine. The same bike that glides on a basketball court can be a struggle on loose gravel, and the spec that matters changes with the ground. This guide walks through the five surfaces most families actually ride, and what each one demands.

## Pavement and smooth concrete

The easiest surface, and the one most first strides happen on. Foam and pneumatic wheels both work here. Smooth pavement is also where the grip difference shows up least — which is why it is the right place to start.

What matters: a flat, car-free surface wide enough to coast. School parking lots on weekends, empty tennis courts, and quiet sidewalks all qualify.

## Parks and hard-packed trails

Park paths mix smooth sections with roots, seams, and the occasional patch of sand. Pneumatic wheels absorb more of the small chatter and hold better through turns; foam wheels trade grip for zero maintenance. Either works, but expect the child to slow down over rough sections — that is normal, not a failure.

What matters: tire type (pneumatic for comfort, foam for convenience) and a frame light enough for the child to pick up after a tumble.

## Grass

Grass is the honest test of a balance bike. Rolling resistance is high, so a heavy frame that was manageable on pavement becomes a push. Foam wheels sink slightly and lose more energy than pneumatic tires on soft ground.

What matters: weight above all. If your main riding surface is a lawn, bias toward the lighter end of your budget and keep sessions short. Many families find grass is where a budget bike's weight penalty becomes obvious.

## Gravel and loose surfaces

Loose gravel is where narrow wheels bog down and steering gets vague. For occasional gravel, wider pneumatic tires help more than any frame upgrade. For regular gravel riding, a dedicated kids' bike with knobby tires is the better tool — balance bikes are optimized for smooth and packed surfaces.

What matters: tire width and tread. If gravel is a weekly surface for you, it belongs in the buying decision, not the "we'll see" column.

## Indoors

Foam wheels earn their keep indoors: no punctures, no marks on hardwood, and enough grip for smooth floors. The limiting factor indoors is usually space, not the bike.

What matters: a small footprint and a frame the child can lift themselves — indoors, the bike will be picked up and carried constantly.

## The pattern across surfaces

Two specs dominate every terrain conversation:

1. **Weight.** A lighter bike is easier to lift, carry, and re-start on every surface. The difference between 4 and 7 pounds is small to an adult and enormous to a 2-year-old.
2. **Tire type.** Foam trades grip and comfort for maintenance-free convenience; pneumatic tires give back grip and shock absorption at the cost of occasional inflation.

If you ride mostly smooth ground, tire choice barely matters and weight matters most. The rougher and softer your regular surfaces, the more tire tread and width earn their place. For the physics behind why frame geometry and wheelbase change how stable a bike feels on each surface, see our guide to [what makes a stable track balance bike](/balance-bike-stability/).`,
    },
    zh: {
      title: "平衡车在哪里骑：地形指南",
      content: `平衡车是一辆对路面敏感的机器。同一辆车在篮球场上能滑得飞快，到了松散砾石上可能就成了负担——真正重要的规格随地而变。本文走一遍大多数家庭实际会骑的五种路面，以及每种路面要求什么。

## 人行道与光滑水泥地

最简单的路面，也是大多数第一次滑行发生的地方。发泡轮和充气胎都能胜任。光滑路面也是抓地力差异最不明显的地方——这正是应该从这里开始的原因。

关键：一块够滑很远、平整无车的场地。周末的学校停车场、空无一人的网球场、安静的人行道都算。

## 公园与压实小径

公园小径混合了光滑段、树根、接缝和偶尔的沙土。充气胎吸收更多细碎颠簸、过弯抓地更好；发泡轮用抓地力换零维护。两者都行，但孩子在粗糙路段会慢下来——这正常，不是失败。

关键：轮胎类型（充气求舒适、发泡求省事）和一辆摔了之后孩子搬得动的车架。

## 草地

草地是平衡车的诚实考场。滚动阻力很高，在水泥地上轻松可控的重车，到了草地上就成了推力。发泡轮会轻微下陷，比充气胎在软地上损失更多能量。

关键：重量优先。如果主骑场地是草坪，往预算的轻端靠，并缩短单次练习。很多家庭发现，草地是入门车重量代价最明显的地方。

## 砾石与松散路面

松散砾石上窄轮会下陷、转向会发虚。偶尔骑砾石，宽一点的充气胎比任何车架升级都管用。如果经常骑砾石，带齿胎的专业儿童车才是对的工具——平衡车是为光滑和压实路面优化的。

关键：胎宽与胎纹。如果砾石是你每周的路面，它该进购买决策，而不是"到时候再说"那一栏。

## 室内

发泡轮在室内物尽其用：不扎胎、不在木地板上留痕、光滑地面上抓地够用。室内的限制因素通常是空间，不是车。

关键：小的占地，和一副孩子搬得动的车架——在室内，车会被不停地拿起搬走。

## 跨地段的规律

两样规格主导了所有地形讨论：

1. **重量。**更轻的车在任何路面都更容易抬起、搬走和重新起步。4 磅和 7 磅的差别对大人很小，对 2 岁孩子巨大。
2. **轮胎类型。**发泡用抓地与舒适换免维护；充气胎还你抓地与减震，代价是偶尔要打气。

如果主要在光滑地面上骑，轮胎选择几乎不重要，重量最重要。你的常规路面越粗糙越软，胎纹和胎宽越值得花钱。至于车架几何与轴距为什么改变每种路面上的稳定感，见我们的[稳定轨迹平衡车指南](/balance-bike-stability/)。`,
    },
  },
  {
    id: "guide-2026-first-ride-checks",
    slug: "balance-bike-safety-checks",
    category: "risk",
    taxonomy: { productCategory: "balance", hub: "all_guides", topicCategory: "risk", topicOrder: 1 },
    seo: {
      en: {
        title: "Before the First Ride: 5 Safety Checks",
        description:
          "Five checks before the first ride: seat height vs inseam, sharp edges, loose bolts, handlebar grip, and helmet fit — with the standards behind each.",
        keywords: ["balance bike safety", "balance bike checklist", "balance bike helmet age"],
      },
      zh: {
        title: "第一次骑行前：5 项安全检查",
        description:
          "首骑前的 5 项检查：座高与腿长、锐边、松动螺栓、把套与头盔贴合——每项背后的标准依据。",
        keywords: ["平衡车安全", "平衡车检查清单", "平衡车头盔"],
      },
    },
    en: {
      title: "Before the First Ride: 5 Safety Checks",
      content: `Five minutes with a hex key before the first ride catches most of what goes wrong later. These are the checks worth doing on any new or used balance bike, in the order that matters, with the standard behind each one.

## Check 1: Seat height against inseam

Set the seat at its lowest position and have the child stand over the bike. The seat should sit at or just below their inseam, and when seated, both feet should rest flat with a slight knee bend. If the child has to tiptoe, lower the seat — or the bike is too big for now.

Why it matters: the whole point of a balance bike is that the rider can catch themselves with their feet. A bike that is too tall removes that safety net.

The standard behind it: US rules for sidewalk bikes ([16 CFR 1512](https://www.ecfr.gov/current/title-16/chapter-II/subchapter-C/part-1512), which covers balance bikes with seat heights up to 25 inches) require a permanent minimum-insertion mark on the seat post — the seat must never be raised above it. EU rules under the EN 71 series now spell out minimum insertion depth for adjustable seat posts as well. Pull the seat post out and confirm the mark is visible.

## Check 2: Sharp edges and protrusions

Run a hand over the frame, fork, handlebar ends, and any welded joints. Nothing should catch skin or cut. Check the ends of the handlebars specifically — exposed bar ends are a common finding on used bikes.

Why it matters: the first crash usually happens at low speed, and it usually involves the bike landing on the child.

The standard behind it: accessible edges must be smooth under [ASTM F963](https://www.cpsc.gov/Business--Manufacturing/Business-Education/Business-Guidance/Childrens-Products) (mandatory for toys in the US via 16 CFR 1250) and EN 71-1. Bar-end protection is tested explicitly under the 2026 edition of EN 71-1.

## Check 3: Loose bolts and clamps

Check every bolt you can reach: stem, handlebar clamp, seat clamp, wheel nuts. Then check them again after the first week of riding — vibration finds loose fasteners. Stem and seat-post clamping torque is now tested under EN 71-1:2026 for a reason.

Why it matters: a slipping seat post or loose stem is the most common mechanical failure on kids' bikes, and it tends to happen mid-ride.

The standard behind it: EN 71-1:2026 holds handlebar stems at 10 N·m for one minute and tests saddle and seat-post security under load.

## Check 4: Handlebar grip and rotation

Grip the handlebars and turn them through their full range. Steering should be smooth, with no play at the headset and no binding. The grips should not rotate in the child's hands.

Why it matters: a child steering by leaning needs bars that respond predictably.

The standard behind it: handlebar and steering integrity requirements appear in 16 CFR 1512 for sidewalk bikes and in the ride-on clauses of EN 71-1.

## Check 5: Helmet fit

A helmet sits level on the head, not tilted back, with the strap snug enough that it stays put when the child shakes their head. The front edge should sit about two finger-widths above the eyebrows. Replace after any crash that involves an impact, and on the manufacturer's schedule — most specify replacement every few years.

Why it matters: head protection is the one piece of safety equipment with consistent evidence behind it for wheeled sports.

The standard behind it: helmets sold for cycling in the US must comply with CPSC's mandatory standard (16 CFR 1203); in the EU, look for CE marking under the applicable personal protective equipment rules.

## Before you buy: the recall check

New or used, check the model against recall databases before the first ride. Our [balance bike recall record](/guides/risk/balance-bike-recall-record) tracks CPSC and EU Safety Gate activity, and both databases are searchable for free. This takes two minutes and is the highest-value safety step in this entire guide.

## What not to overdo

Balance bikes are low-speed, feet-first machines. You do not need knee pads, a specific "training program," or a particular brand of accessory. The five checks above, a flat safe surface, and adult supervision cover the real risks. Adding more gear adds cost and friction without adding much safety.

## The one-page version

1. Seat height matches inseam; insertion mark visible
2. No sharp edges, especially at handlebar ends
3. All bolts tight; re-check after week one
4. Steering smooth with no play; grips secure
5. Helmet level, snug, replaced after impacts`,
    },
    zh: {
      title: "第一次骑行前：5 项安全检查",
      content: `首骑前花五分钟、拿一把内六角扳手，能挡掉日后大多数问题。以下五项检查适用于任何新车或二手平衡车，按重要性排序，每项都附背后的标准依据。

## 检查 1：座高对腿长

把座位调到最低，让孩子跨站在车上。座位应落在孩子腿长处或略低；坐好后双脚平放、膝盖微弯。如果孩子得踮脚，就把座放低——或者这辆车现在太大了。

为什么重要：平衡车的全部意义在于骑手能用脚自救。太高的车拆掉了这张安全网。

标准依据：美国对人行道自行车的规定（[16 CFR 1512](https://www.ecfr.gov/current/title-16/chapter-II/subchapter-C/part-1512)，覆盖座高 25 英寸以内的平衡车）要求座管上有永久性最小插入深度标记——座位永远不能超过它。欧盟 EN 71 系列现在也明确了可调节座管的最小插入深度。把座管拔出来，确认标记可见。

## 检查 2：锐边与突起

用手过一遍车架、前叉、把端和所有焊点。任何东西都不该挂皮肤或割手。把端要专门查——裸露的把端是二手车上最常见的发现。

为什么重要：第一次摔倒通常发生在低速，而且通常是车砸到孩子身上。

标准依据：可触及边缘必须光滑，见 [ASTM F963](https://www.cpsc.gov/Business--Manufacturing/Business-Education/Business-Guidance/Childrens-Products)（在美国经 16 CFR 1250 对玩具强制适用）与 EN 71-1。把端保护在 EN 71-1:2026 版里有明确测试。

## 检查 3：松动螺栓与夹具

够得到的螺栓全查：把立、把夹具、座夹、轮螺母。骑一周后再查一遍——震动总能找到松动的紧固件。把立与座管的夹紧扭矩如今在 EN 71-1:2026 下有测试，不是没有原因的。

为什么重要：座管下滑或把立松动是儿童车上最常见的机械故障，而且往往发生在骑行途中。

标准依据：EN 71-1:2026 以 10 N·m 扭矩保持把立一分钟，并在负载下测试鞍座与座管安全性。

## 检查 4：把套与转向

握住车把转满整个行程。转向应顺滑，头碗无旷量、无卡滞。把套不该在孩子手里打转。

为什么重要：靠侧倾来转向的孩子，需要响应可预测的车把。

标准依据：车把与转向完整性要求见 16 CFR 1512（人行道自行车）及 EN 71-1 的乘骑玩具条款。

## 检查 5：头盔贴合

头盔水平戴在头上，不后翘，束带紧到孩子摇头时不会移位。前缘应在眉骨上方约两指宽。任何涉及撞击的摔车后更换，并按厂商节奏——多数厂商规定几年一换。

为什么重要：头部防护是轮式运动安全装备里证据最一致的一件。

标准依据：美国销售的骑行头盔必须符合 CPSC 强制标准（16 CFR 1203）；欧盟看 CE 标志及适用的个人防护装备规则。

## 购买前：查召回

新车二手，首骑前都把型号对一遍召回数据库。我们的[平衡车召回记录](/guides/risk/balance-bike-recall-record)跟踪 CPSC 与欧盟 Safety Gate 动态，两个数据库都免费可查。这一步只要两分钟，是整篇指南里性价比最高的安全动作。

## 不要过度

平衡车是低速、脚先着地的机器。你不需要护膝、特定的"训练课程"或某个品牌的配件。上面五项检查、一块平整安全的场地、成人看护，覆盖了真实风险。加更多装备只增加成本和摩擦，不增加多少安全。

## 一页纸版本

1. 座高匹配腿长；插入标记可见
2. 无锐边，尤其是把端
3. 所有螺栓紧固；一周后复查
4. 转向顺滑无旷量；把套不转
5. 头盔水平、束带紧、撞击后更换`,
    },
  },
  {
    id: "guide-2026-maintenance",
    slug: "balance-bike-maintenance",
    category: "maintenance",
    taxonomy: { productCategory: "balance", hub: "all_guides", topicCategory: "maintenance", topicOrder: 1 },
    seo: {
      en: {
        title: "Balance Bike Maintenance: What Matters",
        description:
          "What actually needs maintenance on a balance bike — tires, bolts, brakes if fitted — what you can ignore, and how frame material changes the upkeep.",
        keywords: ["balance bike maintenance", "balance bike tires foam air", "balance bike bolts"],
      },
      zh: {
        title: "平衡车保养：真正重要的事",
        description:
          "平衡车真正需要保养的部分——轮胎、螺栓、刹车（如有），可以忽略的部分，以及车架材质如何改变保养量。",
        keywords: ["平衡车保养", "平衡车轮胎", "平衡车螺栓"],
      },
    },
    en: {
      title: "Balance Bike Maintenance: What Matters",
      content: `A balance bike has fewer moving parts than almost anything else on wheels, and the maintenance list is correspondingly short. Here is what actually needs attention, what you can skip, and how the frame material you choose changes the workload.

## The short list

If you do only three things, do these:

1. Check the bolts every few weeks — stem, seat clamp, wheel nuts.
2. Keep the tires at spec: foam wheels need nothing; pneumatic tires need a monthly pressure check.
3. Wipe the bike down after wet or muddy rides, especially around the bearings and seat post.

That is genuinely most of it. Everything below is detail.

## Tires: foam versus pneumatic

Foam (EVA) wheels are the low-maintenance choice: nothing to inflate, nothing to puncture, nothing to check. The trade-off is grip and comfort — foam rolls harder and holds less well on wet or smooth surfaces.

Pneumatic tires need air. Check pressure monthly with a gauge rather than by thumb; the correct range is printed on the tire sidewall. Under-inflation increases rolling resistance and pinch-flat risk; over-inflation reduces grip. A slow leak over a week or two is normal; a flat overnight is not.

If a pneumatic tire goes flat and the bike will not be repaired immediately, the bike can still be rolled slowly — but plan to fix or replace the tube before the next proper session.

## Bolts and clamps

Vibration is the enemy. Check every reachable fastener every few weeks during the first month, then monthly. A loose seat clamp shows up as a slipping saddle mid-ride; a loose stem shows up as vague steering.

The fix is a proper hex key, tightened to a firm-but-not-forced feel. Manufacturers publish torque values for some clamps; where they do not, "snug" is the working standard — the goal is that nothing moves under the child's weight and steering forces.

## Steering and bearings

Grab each wheel and rock it side to side. A tiny click of play is normal on budget bikes; visible looseness or a grinding feel means the bearings need attention — usually a tighten, occasionally a replacement. If the bike gets rained on or pressure-washed, expect to do this sooner: water is what kills cheap bearings.

## Brakes, if fitted

Most balance bikes have no brakes — children stop with their feet, which is the point of the format. Some larger or premium models add a hand brake. If yours has one:

- Check that the lever is reachable by small hands and pulls without hitting the grip.
- Confirm the brake actually stops the bike on a safe surface, gently, before the child relies on it.
- Watch pad wear; replacement pads are inexpensive and model-specific.

## Frame material and upkeep

- **Steel**: the cheapest to buy and the most to maintain. Check paint chips and touch them up to prevent rust, and keep the bike dry where possible.
- **Aluminum and alloy**: no rust, lighter, and effectively maintenance-free on the frame itself.
- **Composite (nylon and similar)**: new to the balance bike market in 2026. No rust and light like aluminum, but long-term UV and fatigue data is still being gathered — inspect for cracks around high-stress joints periodically.

For published weights across current models and how material changes them, see [how much a balance bike weighs](/balance-bike-weight/).

## When to retire the bike

Retire a frame when you find a crack, a bend, or deep rust at a joint — do not attempt a repair on a cracked kids' frame. Retire foam wheels when they are worn flat or cracked, and pneumatic wheels when the sidewalls are cut or the tread is gone. Seats and grips are wear items and can be replaced; frames are not worth the risk.

## What you can ignore

You do not need chain lube (no chain), gear adjustment (no gears), suspension servicing (no suspension), or a torque wrench (a hex key is fine). Balance bikes are simple on purpose — keep the maintenance proportionally simple.`,
    },
    zh: {
      title: "平衡车保养：真正重要的事",
      content: `平衡车是带轮器械里活动件最少的一类，保养清单相应地短。以下是真正需要关注的部分、可以跳过的部分，以及车架材质如何改变你的工作量。

## 短清单

只做三件事的话，做这些：

1. 每几周查一次螺栓——把立、座夹、轮螺母。
2. 轮胎维持规格：发泡轮什么都不用管；充气胎每月查一次胎压。
3. 雨天或泥地骑完擦车，尤其轴承和座管周围。

真的就这些。以下是细节。

## 轮胎：发泡对充气

发泡（EVA）轮是低维护选择：不用打气、不会扎、不用检查。代价是抓地与舒适——发泡滚阻更硬，湿滑光滑地面上抓地较弱。

充气胎需要气。每月用胎压表而不是拇指检查；正确范围印在胎壁上。气压不足会增加滚阻和夹胎风险；气压过高降低抓地。一两周内缓慢慢撒气是正常的；一夜之间瘪掉不是。

充气胎瘪了又不马上修，车还能慢慢推行——但计划在下一次正式练习前换胎或补胎。

## 螺栓与夹具

震动是敌人。第一个月每几周查一遍所有够得到的紧固件，之后每月一次。座夹松了表现为骑行中座垫下滑；把立松了表现为转向发虚。

修法是一把正经内六角扳手，紧到"牢固但不硬拧"的手感。部分夹具有厂商公布的扭矩值；没有公布的，"拧紧"就是工作标准——目标是孩子的体重和转向力下没有任何东西会动。

## 转向与轴承

抓住每个车轮左右摇。预算车上有极轻微的旷量点击声属正常；明显松旷或研磨感说明轴承需要处理——通常是紧固，偶尔是更换。如果车被雨淋或高压水枪冲过，这一天会来得更早：水是廉价轴承的杀手。

## 刹车（如有）

大多数平衡车没有刹车——孩子用脚停车，这正是这种车型的意义所在。部分较大或高端车型加了手刹。如果你的车有：

- 检查刹把小手够得到、拉到底不撞把套。
- 在孩子依赖刹车之前，先在安全场地上确认它真能让车停下、且力度轻柔。
- 留意来令片磨损；替换片便宜且按型号配。

## 车架材质与保养量

- **钢**：最便宜买、最多事养。检查掉漆并补漆防锈，尽量保持干燥。
- **铝与合金**：不生锈、更轻，车架本身基本免维护。
- **复合材质（尼龙等）**：2026 年才进入平衡车市场。不生锈、像铝一样轻，但长期紫外线与疲劳数据还在积累——定期检查高应力接头周围有无裂纹。

现役款式的公开重量及材质如何影响它们，见[平衡车有多重](/balance-bike-weight/)。

## 什么时候退役

发现车架开裂、弯曲或接头深度锈蚀就退役——不要试图修复开裂的童车车架。发泡轮磨平或开裂、充气胎侧壁割伤或胎纹磨平时退役。座垫和把套是易损件，可换；车架不值得冒险。

## 可以忽略的部分

你不需要链条油（没有链条）、变速调试（没有变速）、避震保养（没有避震）或扭矩扳手（内六角就够）。平衡车刻意做得简单——保养也按比例保持简单。`,
    },
  },
  {
    id: "guide-2026-extra-support",
    slug: "balance-bikes-extra-support",
    category: "special",
    taxonomy: { productCategory: "balance", hub: "all_guides", topicCategory: "special", topicOrder: 1 },
    seo: {
      en: {
        title: "Balance Bikes for Kids Who Need Support",
        description:
          "For kids who need extra support: inseam-first sizing, step-through frames, and the adjustments that matter more than the model you pick.",
        keywords: ["balance bike special needs", "adaptive balance bike", "balance bike inseam fit"],
      },
      zh: {
        title: "需要额外支持的孩子怎么选平衡车",
        description:
          "给需要额外支持的孩子：腿长优先的尺码逻辑、低横梁车架，以及比型号更重要的调节项。",
        keywords: ["特殊需求平衡车", "适配平衡车", "平衡车腿长"],
      },
    },
    en: {
      title: "Balance Bikes for Kids Who Need Support",
      content: `Some children need more support when they are learning to ride — because they are smaller, slower to build confidence, working with a therapist on motor skills, or simply more cautious than their peers. This guide is about the physical fit decisions that matter in that situation. It is not medical advice, and nothing here substitutes for guidance from a professional who knows your child.

## Fit comes first, twice as carefully

When support is the priority, sizing moves from "important" to "everything." The rule is the same as for any rider, but the margin for error is smaller:

- **Inseam sets the seat.** The lowest seat position should sit at or just below the child's inseam, with both feet flat and a slight knee bend when seated.
- **The bike must be light enough for the child to correct themselves.** A bike the child cannot lift or tilt is a bike they cannot recover from.
- **Stand-over height matters.** The child should be able to straddle the frame comfortably, and step through rather than over it if mobility is limited.

Our [balance bike size chart](/balance-bike-size-chart/) shows published seat ranges and stand-over heights across current models; our [balance bike by age](/balance-bike-by-age/) guide explains the inseam-to-seat logic in detail.

## Frame geometry: the low step-through

A step-through or low top-tube frame is the single most useful geometry feature for riders who need support. It lets the child mount and dismount by stepping through instead of swinging a leg over, and it lowers the center of gravity, which makes the bike feel more stable at rest.

What to look for:

1. A top tube that drops well below the saddle height.
2. A narrow bottom-bracket area, so the rider's feet are not pushed wide apart.
3. A stable wheelbase — longer tracks straighter, shorter turns quicker. For a nervous rider, straighter is calmer.

## Weight and handling

Every pound the rider does not have to fight is a pound they can spend on balance. Published weights for balance bikes run from about 3.3 to 7.8 lb (1.5–3.5 kg). For a child who needs support, aim for the lighter end of the range for their size — and remember that the "right" weight is relative to the rider: a rough guide is that the bike should weigh no more than about a third of the rider's weight.

## Four adjustments that matter more than the model

1. **Seat height range.** A longer range (roughly 11–17 inches) means the bike fits as the child grows and as their confidence changes.
2. **Handlebar height and reach.** Some models fix the bars at one height; adjustable bars let you match the rider's current posture. The bars should be reachable without leaning forward or reaching up.
3. **Grip diameter and texture.** Smaller hands need thinner grips with real texture, so the rider holds on without squeezing hard.
4. **Seat post clamp design.** A quick-release or tool-free clamp makes on-the-spot height changes easy — useful when you are adjusting repeatedly during a session.

## Practice environment

The right environment is flat, wide, car-free, and predictable: an empty parking lot, a quiet path, a large room. Predictability is the feature — a nervous rider benefits more from a surface with no surprises than from an interesting one. Short, frequent sessions beat long ones.

## What this guide does not cover

This article covers physical fit and setup only. It makes no claims about any medical or developmental condition, and no bike is "for" any condition. If your child works with a therapist or physician on motor skills, involve them in the fit decision — they can tell you what constraints to optimize for, and this guide can help you find a bike that meets them.

## The honest summary

For a child who needs support, the bike matters less than the fit and the surface. Measure the inseam, choose a light step-through frame with a long seat range, and ride on flat predictable ground. That combination serves most riders who need support better than any premium feature.`,
    },
    zh: {
      title: "需要额外支持的孩子怎么选平衡车",
      content: `有些孩子学骑车时需要更多支持——可能因为体型更小、信心建立更慢、正在和治疗师一起练动作技能，或者只是比同龄人更谨慎。本文讲的是这种情况下真正重要的物理适配决策。它不是医疗建议，也不能替代了解你孩子的专业人士的指导。

## 适配优先，而且要以两倍的仔细

当"支持"是优先级时，尺码从"重要"变成"一切"。规则和任何骑手相同，但容错更小：

- **腿长定座位。**最低座位应落在孩子腿长处或略低，坐好后双脚平放、膝盖微弯。
- **车必须轻到孩子能自我纠正。**孩子抬不动、扶不正的车，就是他们救不回来的车。
- **跨高很重要。**孩子应能舒适地跨在车架上；行动不便时，最好能从车架下方迈过去，而不是甩腿跨越。

我们的[平衡车尺码表](/balance-bike-size-chart/)列出现役款式的座高范围与跨高；[平衡车按年龄选](/balance-bike-by-age/)指南详解腿长定座位的逻辑。

## 车架几何：低横梁

低横梁（step-through）车架是对需要支持的骑手最有用的一个几何特征。它让孩子迈腿穿框上下车，而不是甩腿跨越，同时降低重心，让车静止时更稳。

要看这几点：

1. 上管明显低于鞍座高度。
2. 五通区域收得窄，孩子的脚不被撑得很开。
3. 稳定的轴距——轴距长走得直、短则转弯灵。对紧张的孩子，直一点更安心。

## 重量与操控

骑手不必对抗的每一磅，都是可以花在平衡上的一磅。平衡车公开重量约 3.3–7.8 磅（1.5–3.5 公斤）。对需要支持的孩子，往相应尺寸里较轻的一端靠——并且记住"合适"的重量是相对于骑手的：一个粗略指南是车重不超过骑手体重的约三分之一。

## 比型号更重要的四项调节

1. **座高范围。**范围越长（大致 11–17 英寸），车越能陪孩子长大、跟上他信心的变化。
2. **车把高度与距离。**有些型号把高固定；可调车把能匹配骑手当前姿势。车把应是不前倾、不抬手就够得到。
3. **把套直径与纹理。**小手需要更细、纹理更实的把套，孩子不用死握也拿得住。
4. **座夹设计。**快拆或免工具座夹让当场调高变得容易——当你要在一节课里反复调整时，这很关键。

## 练习环境

对的环境是平、宽、无车、可预期：空停车场、安静小径、大房间。可预期才是特性——紧张的孩子从"没有惊喜"的路面受益，比从"有趣"的路面更多。短而频繁的练习胜过长时间练习。

## 本文不涉及什么

本文只讲物理适配与设置。它不对任何医疗、发育或治疗状况作任何宣称，也没有任何车是"为"某种状况而生的。如果你的孩子正在和治疗师或医生一起练动作技能，请让他们参与适配决策——他们能告诉你该优化哪些约束，本文可以帮你找到满足这些约束的车。

## 诚实的总结

对需要支持的孩子，车不如适配和场地重要。量好腿长，选一辆轻的低横梁车架、座高范围长的车，骑在平坦可预期的地面上。这个组合比任何高端功能都更能服务大多数需要支持的骑手。`,
    },
  },
];

const NEWS = [
  {
    id: "news-2026-research",
    slug: "balance-bike-research",
    category: "science",
    seo: {
      en: {
        title: "What Research Says About Balance Bikes",
        description:
          "What published research says about balance bikes and early motor development — and the caveats that come with the studies.",
        keywords: ["balance bike research", "balance bike motor development", "balance bike study"],
      },
      zh: {
        title: "研究怎么看平衡车",
        description:
          "已发表研究对平衡车与早期运动发展怎么说，以及这些研究自带的前提与局限。",
        keywords: ["平衡车研究", "平衡车运动发展", "平衡车学习"],
      },
    },
    en: {
      title: "What Research Says About Balance Bikes",
      content: `Balance bikes are often described as "research-backed." The research is real, it is recent, and it is thinner than the marketing suggests. Here is what the published studies actually measured, what they found, and what they have not shown.

## What the studies measured

The English-language literature on balance bikes is small and concentrated. Two peer-reviewed studies from the same Portuguese research group do most of the work.

The [2022 study in the International Journal of Environmental Research and Public Health](https://www.mdpi.com/1660-4601/19/3/1814) analyzed 2,005 parent responses collected in Portugal between November 2019 and June 2020. Its outcome measure was learning age — the age at which a child first cycled independently. Children whose first bike was a balance bike averaged 4.16 years; those who started with training wheels averaged 5.97; those who started directly on a pedal bike averaged 7.27. The differences were statistically significant.

The [2025 study in the Journal of Functional Morphology and Kinesiology](https://www.mdpi.com/2411-5142/10/1/53) was an intervention: 50 children who could not yet cycle practiced for six sessions on either a balance bike or a training-wheel bike, then moved to a conventional bicycle. Independent-cycling success was 100% in the balance-bike group and about 77% in the training-wheels group. Balance-bike learners were faster at each milestone: self-launch, riding, and braking.

## What the research says, stated carefully

Taken together, the studies support a narrow claim: when a balance bike is a child's first bike, they tend to reach independent cycling sooner than children who start with training wheels. The 2025 authors also found that children with higher BMI percentiles took longer to reach balance milestones — a finding about the sample, not a claim about any individual child.

## What the research has not shown

This is the part that gets skipped in product marketing. The honest gaps:

- **No long-term skill or safety outcomes.** Neither study followed children to see whether balance-bike starters ride more safely, enjoy cycling more, or crash less years later.
- **Small and regional samples.** The 2025 study included 50 children from one region; peer reviewers specifically questioned the baseline equivalence of its groups and the strength of its body-composition conclusions.
- **Self-reported data in the 2022 study.** Families chose their own tools, so household factors — not just the bike — may explain part of the gap.
- **No dose-response evidence.** Nobody has published a study showing how many hours of balance-bike practice produce what outcome.
- **A young literature.** Both studies come from one research group; independent replication by other groups is still limited.

"Balance bikes help children learn to cycle sooner" is what the evidence currently supports. Anything stronger — developmental advantages, athletic benefits, safety improvements — is ahead of the data.

## How to use this as a parent

The practical reading is simple: start with a balance bike that fits, ride it regularly, and do not stress about the timeline. The average in the 2022 survey is just over four years to independent cycling, but the spread around that average is wide. For fit specifics, our [balance bike by age](/balance-bike-by-age/) guide covers the inseam-to-seat measurement that matters more than any study.`,
    },
    zh: {
      title: "研究怎么看平衡车",
      content: `平衡车常被描述为"有研究背书"。研究是真的，很新，也比营销暗示的更薄。以下是已发表研究实际测量了什么、发现了什么，以及没有证明什么。

## 研究测了什么

平衡车的英文文献很少且集中。大多数工作由同一支葡萄牙研究团队的两项同行评审研究完成。

[2022 年发表于《国际环境研究与公共卫生杂志》的研究](https://www.mdpi.com/1660-4601/19/3/1814)分析了 2019 年 11 月至 2020 年 6 月在葡萄牙收集的 2005 份家长回复。其结果指标是"学会年龄"——孩子首次独立骑车的年龄。第一辆车是平衡车的孩子平均 4.16 岁；从训练轮起步的平均 5.97 岁；直接上脚踏车的平均 7.27 岁。差异具有统计显著性。

[2025 年发表于《功能形态学与运动学杂志》的研究](https://www.mdpi.com/2411-5142/10/1/53)是一项干预实验：50 名还不会骑车的孩子在平衡车或训练轮车上练习六个课时，然后转到普通自行车。独立骑行成功率在平衡车组为 100%，训练轮组约 77%。平衡车组在每个里程碑上都更快：自主起步、骑行、刹车。

## 研究说了什么，谨慎地陈述

合起来，这些研究支持一个狭窄的结论：当平衡车是孩子的第一辆车时，他们往往比从训练轮起步的孩子更早达到独立骑行。2025 年研究还发现 BMI 百分位较高的孩子达到平衡里程碑更慢——这是关于样本的发现，不是对任何个体孩子的宣称。

## 研究没有证明什么

这是产品营销里最常被跳过的一段。诚实的空白：

- **没有长期技能或安全结果。**两项研究都没有追踪孩子多年，看平衡车起步者是否骑得更安全、更享受骑行、或更少摔车。
- **样本小且地域单一。**2025 年研究只有 50 名孩子，来自同一地区；同行评审人明确质疑过两组起点的等价性及其身体构成结论的强度。
- **2022 年研究是自报数据。**家庭自己选择工具，所以家庭因素——不只是车——可能解释了一部分差距。
- **没有剂量-效应证据。**没有人发表过"练多少小时产生什么结果"的研究。
- **文献年轻。**两项研究出自同一个团队；其他团队的独立复现仍然有限。

"平衡车帮助孩子更早学会骑车"是现有证据支持的表述。任何更强的说法——发育优势、运动能力收益、安全改善——都跑在了数据前面。

## 家长怎么用这些信息

实际读法很简单：从一辆合适的平衡车开始，规律地骑，别为时间线焦虑。2022 年调查里独立骑行的均值是刚过四岁，但围绕这个均值的分布很宽。适配细节见我们的[平衡车按年龄选](/balance-bike-by-age/)指南——腿长量座高这件事，比任何研究都重要。`,
    },
  },
  {
    id: "news-2026-standards",
    slug: "ride-on-safety-standards-2026",
    category: "industry",
    seo: {
      en: {
        title: "2026 Kids' Ride-On Safety Standard Updates",
        description:
          "US and EU safety standard updates affecting kids' ride-ons in 2026 — what changed, what it means for balance bikes, and how to verify compliance.",
        keywords: ["kids bike safety standards", "CPSC balance bike", "EN 71 ride-on", "balance bike regulations"],
      },
      zh: {
        title: "2026 儿童骑乘玩具安全标准更新",
        description:
          "2026 年美欧儿童骑乘玩具安全标准更新——改了什么、对平衡车意味着什么、怎么验证合规。",
        keywords: ["童车安全标准", "CPSC 平衡车", "EN 71", "平衡车法规"],
      },
    },
    en: {
      title: "2026 Kids' Ride-On Safety Standard Updates",
      content: `The biggest change to kids' ride-on safety rules in years landed in Europe this year, and it puts balance bikes under a dedicated set of test clauses for the first time. Here is what changed on both sides of the Atlantic, what it means for balance bikes specifically, and how to check a bike against the current rules.

## Europe: EN 71-1:2026 gives balance bikes their own clauses

On 28 January 2026, the European Committee for Standardization (CEN) distributed the new edition of EN 71-1, the mechanical and physical performance half of the EU toy safety standards. It replaces EN 71-1:2014+A1:2018.

The headline change for this site: ride-on toys — bicycles, balance bikes, and scooters — were gathered into a single clause (8.21) with eleven subclauses, five of them new tests:

1. **Handlebar end impact.** Each handlebar end is struck against a hard surface ten times.
2. **Brake performance.** Brakes are judged against force tables, with input forces of 40, 50, and 60 N applied step by step, rather than a single distance measurement.
3. **Handlebar stem security.** A torque of 10 N·m is held for one minute.
4. **Stabilizer strength.** A 300 N load on each stabilizer wheel, with deflection and permanent-set limits.
5. **Saddle and seat-post security.** A vertical load of 200 N on the saddle.

Balance bikes specifically gain requirements the standard previously did not spell out: clearance dimensions, minimum front-wheel diameter, handlebar dimensions, brake requirements, minimum insertion-depth marks for adjustable stems and seat posts, clamping requirements, and stability plus static and dynamic strength tests — along with new requirements for warnings, labels, and maintenance instructions.

The timeline: national standards bodies had until 31 July 2026 to adopt EN 71-1:2026, and conflicting national standards must be withdrawn by 31 July 2027. The edition is expected to be approved by the European Commission roughly twelve months after publication, at which point it becomes a harmonized standard under the Toy Safety Directive 2009/48/EC — the version that carries legal weight in the EU market. Until that approval, CE marking runs through the previous edition and its amendments.

## The United States: no 2026 overhaul, but know your bike's classification

Nothing changed in US federal rules this year. What matters for buyers is understanding which rules a balance bike falls under — and it is not always obvious, because a balance bike has no pedals:

- **Sidewalk bikes.** CPSC generally treats a balance bike with a seat height of 25 inches (63.5 cm) or less as a "sidewalk bike" under 16 CFR 1512. That classification reduces — but does not remove — requirements.
- **CPSIA.** Lead limits (90 ppm in paint, 100 ppm in substrate), phthalate limits, and the permanent tracking label apply to every children's product, including balance bikes, regardless of the bicycle standard.
- **ASTM F963.** The toy safety standard, mandatory in the US via 16 CFR 1250 since April 2024, covers small parts, sharp edges, and chemical limits, and often applies to balance bikes marketed as toddler toys.

## What this means for balance bike buyers

Two practical consequences:

1. **For EU-market bikes, 2026 and 2027 are a transition window.** A bike certified to the old EN 71-1 edition is not automatically non-compliant — but a bike tested to the 2026 edition has passed balance-bike-specific stability, strength, and handlebar-end tests that the old edition did not require. If a seller cites EN 71-1 compliance, ask which edition.
2. **For US buyers, the classification question decides which certificate to ask for:** a Children's Product Certificate (CPC) referencing 16 CFR 1512, ASTM F963, or both. Any legitimate seller can produce one.

## How to verify a bike in five minutes

1. Find the tracking label on the bike: manufacturer, location, date, batch.
2. Ask the seller for the Children's Product Certificate (US) or Declaration of Conformity (EU), and check which standard edition it cites.
3. Check the recall databases: CPSC in the US, Safety Gate in the EU. Our [balance bike recall record](/guides/risk/balance-bike-recall-record) tracks both.

Our [safety standards reference page](/balance-bike-safety-standards/) walks through the US and EU rule sets in plain language, with the verification steps for each.`,
    },
    zh: {
      title: "2026 儿童骑乘玩具安全标准更新",
      content: `多年来儿童骑乘玩具安全规则最大的一次变动今年落在欧洲，而且平衡车第一次被纳入一套专门的测试条款。以下是大西洋两岸各发生了什么、对平衡车具体意味着什么，以及怎么对照现行规则核查一辆车。

## 欧洲：EN 71-1:2026 给平衡车单列条款

2026 年 1 月 28 日，欧洲标准化委员会（CEN）向各成员国分发了新版 EN 71-1——欧盟玩具安全标准中机械与物理性能的那一半。它替代 EN 71-1:2014+A1:2018。

对本网站最重要的变化：乘骑玩具——自行车、平衡车、滑板车——被并入单一条款（8.21），下辖十一个子条款，其中五项是新测试：

1. **把端冲击。**车把每一端对硬表面撞击十次。
2. **刹车性能。**刹车按力值表判定，分步施加 40、50、60 牛的输入力，而不是测单一距离。
3. **把立安全性。**以 10 N·m 扭矩保持一分钟。
4. **辅轮强度。**每个辅轮承压 300 牛，有形变量与永久变形限值。
5. **鞍座与座管安全性。**鞍座承受 200 牛垂直载荷。

平衡车具体获得了旧版标准未写明的要求：间隙尺寸、前轮最小直径、车把尺寸、刹车要求、可调节把立与座管的最小插入深度标记、夹紧要求，以及稳定性加静态和动态强度测试——同时新增了警告语、标识与使用维护说明的要求。

时间线：各国标准机构应在 2026 年 7 月 31 日前采纳 EN 71-1:2026，冲突的旧国标最晚 2027 年 7 月 31 日废止。该版本预计在发布约十二个月后获欧盟委员会批准，届时成为玩具安全指令 2009/48/EC 下的协调标准——那才是在欧盟市场具有法律效力的版本。在获批之前，CE 标志依据的是旧版及其修订案。

## 美国：2026 年无大修，但要知道你的车归哪类

美国联邦规则今年没有变化。对买家重要的是理解一辆平衡车适用哪些规则——而这并不显然，因为平衡车没有脚踏：

- **人行道自行车。**CPSC 通常把座高 25 英寸（63.5 cm）以内的平衡车视为 16 CFR 1512 下的"人行道自行车"。该归类减少——但不取消——要求。
- **CPSIA。**铅限值（涂层 90 ppm、基材 100 ppm）、邻苯二甲酸盐限值和永久追溯标签适用于所有儿童产品，包括平衡车，与自行车标准无关。
- **ASTM F963。**玩具安全标准，自 2024 年 4 月起在美国经 16 CFR 1250 强制适用，覆盖小零件、锐边和化学限值，通常适用于作为幼儿玩具销售的平衡车。

## 对平衡车买家意味着什么

两个实际后果：

1. **对欧盟市场的车，2026 和 2027 是过渡窗口。**按旧版 EN 71-1 认证的车不会自动不合规——但按 2026 版测试过的车，通过了旧版不要求的平衡车专项稳定性、强度和把端测试。如果卖家援引 EN 71-1 合规，问清是哪一版。
2. **对美国买家，归类问题决定你该要哪种证书：**引用 16 CFR 1512、ASTM F963 或两者的儿童产品证书（CPC）。任何正规卖家都能出具。

## 五分钟核查一辆车

1. 找车上的追溯标签：厂商、地点、日期、批次。
2. 向卖家索要儿童产品证书（美国）或符合性声明（欧盟），并核对引用的标准版本。
3. 查召回数据库：美国 CPSC、欧盟 Safety Gate。我们的[平衡车召回记录](/guides/risk/balance-bike-recall-record)同时跟踪两者。

我们的[安全标准参考页](/balance-bike-safety-standards/)用平实语言梳理美欧规则集，并附每条的核查步骤。`,
    },
  },
  {
    id: "news-2026-launches",
    slug: "new-balance-bikes-2026",
    category: "new_product",
    seo: {
      en: {
        title: "New Balance Bike Launches: 2026 Roundup",
        description:
          "The balance bike launches of 2026 worth a second look — spec changes in weight, seat range and tires, and what they mean for fit.",
        keywords: ["new balance bike 2026", "balance bike launches", "best new balance bike"],
      },
      zh: {
        title: "2026 新平衡车发布盘点",
        description:
          "2026 年值得多看两眼的平衡车新品——重量、座高范围与轮胎的变化，以及对适配的意义。",
        keywords: ["2026 新平衡车", "平衡车新品", "平衡车发布"],
      },
    },
    en: {
      title: "New Balance Bike Launches: 2026 Roundup",
      content: `2026 brought the first genuinely new balance bike from the category's best-known brand in nearly a decade, plus a notable entry from the premium end. Here are the launches with public, dated spec sheets — and what each change means for fit.

## Strider 12 Comp — the first new Strider model since 2017

Strider, the South Dakota brand that effectively created the modern balance bike category, announced the 12 Comp in April 2026 — its first new model since 2017. The headline spec is the frame: nylon composite, bringing the complete weight down to 4.9 lb (2.2 kg), the lightest 12-inch bike in Strider's line.

The published numbers:

- **Weight:** 4.9 lb (2.2 kg)
- **Wheel size:** 12 inches, with EVA foam "Ultralight" wheels; optional pneumatic High-Traction wheels
- **Inseam fit:** 12–16 in (30.5–40.6 cm)
- **Seat height:** 11–15 in (27.9–38.1 cm), adjustable with a snap-to-adjust clip
- **Handlebar:** fixed at 19 in (48.3 cm)
- **Ages:** 1–3 years; maximum rider weight 45 lb (20 kg)
- **MSRP:** $139.99

What it means for fit: the 12 Comp slots below the steel 12 Sport (about 6.7 lb) and the aluminum 12 Pro (about 5.6 lb) in Strider's lineup, with the lightest weight at a mid price. The trade-offs are a fixed handlebar height and a shorter seat range (11–15 in versus up to 17–19 in on the Sport and Pro), which shortens useful life. The composite frame is new for the brand, so long-term durability data does not exist yet — a fair thing to weigh for a bike that might serve two kids.

## Micro Balance Bike Ultra LED Neochrome — listed as new for 2026

Micro, the Swiss scooter brand, has a new top-of-the-range balance bike listed for 2026 by retailers: the Balance Bike Ultra LED Neochrome. Its distinguishing feature is dynamo-powered LED wheel rims that light up as the bike rolls — no batteries. Under the novelty:

- **Weight:** 3.2 kg (about 7 lb)
- **Frame:** lightweight magnesium
- **Wheels:** 12-inch PU foam, puncture-free
- **Saddle:** adjustable, 33.5–40 cm from the ground
- **Ages:** listed from 18 months; retailer listings describe a 2–5 year target
- **Maximum rider weight:** 50 kg
- **Low step-through frame; traditional alloy headset**

What it means for fit: magnesium at this weight is genuinely light for the price class, and the low step-through helps younger riders mount independently. The saddle range tops out at 40 cm (about 15.7 in), so check that against your child's inseam — and note the older target rider than the Strider.

## The pattern worth noticing

Both 2026 launches push on the same two specs: weight and step-through access. That is a real shift — the category's center of gravity has moved from "survive a toddler" to "let a toddler handle the bike themselves." Frame materials are diversifying too: composite (Strider) and magnesium (Micro) join steel and aluminum, which means buyers now have a genuine material trade-off to make rather than a default.

## How to read a launch

When a new model lands, the spec sheet tells you less than it seems. Focus on three numbers: weight relative to your child, the seat range against their inseam, and the wheel type for your main surface. Everything else — colors, accessories, marketing — is decoration. Our [balance bike size chart](/balance-bike-size-chart/) shows how the new seat ranges compare against the current field.`,
    },
    zh: {
      title: "2026 新平衡车发布盘点",
      content: `2026 年，这个品类最知名的品牌推出了近十年来的第一款真正意义上的新平衡车，高端段也有值得一看的新品。以下是发布信息公开、有日期可查的几款新品——以及每个变化对适配的意义。

## Strider 12 Comp——Strider 2017 年以来首款新车型

Strider，这家实际上开创了现代平衡车品类的南达科他品牌，于 2026 年 4 月发布了 12 Comp——这是它 2017 年以来的第一款新车型。头条规格是车架：尼龙复合材质，把整车重量拉到 4.9 磅（2.2 公斤），是 Strider 产品线里最轻的 12 寸车。

公开数字：

- **重量：**4.9 磅（2.2 公斤）
- **轮径：**12 寸，EVA 发泡"Ultralight"轮；可选充气 High-Traction 轮
- **腿长适配：**12–16 英寸（30.5–40.6 cm）
- **座高：**11–15 英寸（27.9–38.1 cm），卡扣式快调
- **车把：**固定 19 英寸（48.3 cm）
- **年龄：**1–3 岁；最大骑手重量 45 磅（20 kg）
- **建议零售价：**139.99 美元

对适配的意义：12 Comp 卡在钢架 12 Sport（约 6.7 磅）和铝架 12 Pro（约 5.6 磅）之间，以中档价格给出最轻重量。代价是车把高度固定、座高范围更短（11–15 英寸，而 Sport/Pro 可达 17–19 英寸），这缩短了有效使用期。复合车架对该品牌是新材料，长期耐久数据尚不存在——对一辆可能要服务两个孩子的车，这是值得权衡的一点。

## Micro Balance Bike Ultra LED Neochrome——零售商列为 2026 新款

瑞士滑板车品牌 Micro 有一款被零售商列为 2026 年新款的新旗舰平衡车：Balance Bike Ultra LED Neochrome。它的辨识特征是花鼓发电的 LED 轮圈，骑起来就亮——不用电池。新意之下：

- **重量：**3.2 公斤（约 7 磅）
- **车架：**轻量化镁合金
- **轮子：**12 寸 PU 发泡，防扎
- **座垫：**可调，离地 33.5–40 cm
- **年龄：**列明 18 个月起；零售商描述的目标人群为 2–5 岁
- **最大骑手重量：**50 公斤
- **低横梁车架；传统合金头碗**

对适配的意义：镁合金在这个价位段确实够轻，低横梁帮助更小的骑手独立上下车。座垫范围上限 40 cm（约 15.7 英寸），请对照孩子的腿长核对——并注意它面向的骑手比 Strider 更大。

## 值得注意的规律

两款 2026 新品推的是同两个规格：重量和低横梁上下车。这是一个真实转向——品类的重心从"扛过一个幼儿"移到了"让幼儿自己摆弄这辆车"。车架材质也在多样化：复合（Strider）和镁合金（Micro）加入了钢和铝的阵营，买家现在有真正的材质取舍可做，而不是默认项。

## 怎么读一次发布

新车型落地时，规格表告诉你的比看起来少。盯三个数字：相对于你孩子的重量、对照腿长的座高范围、以及匹配主骑路面的轮胎类型。其余——颜色、配件、营销——都是装饰。我们的[平衡车尺码表](/balance-bike-size-chart/)展示了新座高范围与现役款式的对比。`,
    },
  },
  {
    id: "news-2026-brand-news-oct",
    slug: "balance-bike-brand-news-october-2026",
    category: "brand_news",
    seo: {
      en: {
        title: "Balance Bike Brand News — October 2026",
        description:
          "October 2026 balance bike brand news: Strider's first new model since 2017, Micro's LED balance bike, woom limited editions, and what each move means.",
        keywords: ["balance bike brands news", "strider news", "woom news"],
      },
      zh: {
        title: "平衡车品牌动态：2026 年 10 月",
        description:
          "2026 年 10 月平衡车品牌动态：Strider 九年来首款新车、Micro LED 平衡车、woom 限量配色，以及每一步对买家的意义。",
        keywords: ["平衡车品牌动态", "Strider 新闻", "woom 新闻"],
      },
    },
    en: {
      title: "Balance Bike Brand News — October 2026",
      content: `The balance bike world moved this year. Strider shipped its first new model since 2017, Micro's LED-wheeled balance bike reached retailers, and woom kept its limited-edition cadence going. Here is what happened and what it means for buyers.

## Strider: first new model since 2017

Strider Bikes announced the 12 Comp in April, and it is now broadly available at $139.99. It is the South Dakota brand's first new balance bike model since 2017 — a long gap for the company that effectively created the category.

The news for buyers is the frame: nylon composite, at 4.9 lb complete, the lightest 12-inch Strider to date. It slots under the steel 12 Sport and aluminum 12 Pro, with a fixed handlebar and a shorter seat range. Our [new-product roundup](/news/new_product/new-balance-bikes-2026/) covers the full spec sheet and the fit implications.

## Micro: LED wheels go dynamo

Micro's Balance Bike Ultra LED Neochrome is listed as new for 2026 by retailers. The gimmick is real engineering: dynamo-powered LED rims with no batteries. Under that, a magnesium frame at about 3.2 kg and a low step-through design put it in contention for lighter-riders-first buyers. See the spec breakdown in our [launches roundup](/news/new_product/new-balance-bikes-2026/).

## woom: limited editions keep coming

woom released neon lime and neon pink limited editions across its line in July, following a Power Pink edition earlier in the year. For balance-bike buyers, the relevant model is the woom GO 1: aluminum frame, 3 kg, 12-inch wheels, sized for roughly 1.5 to 3.5 years and 82–100 cm. Limited editions do not change specs — but they do mean current-season stock rotates quickly, and a color you want may be gone by the next season.

## woom moves up: the EXPLORE e

Also worth noting for brand watchers: woom launched the EXPLORE e globally in March, a pedal-assist e-bike for ages 7–14 with a MAHLE drive. It is not a balance bike and not relevant to toddler buyers, but it signals where the category's revenue is heading — established kids' bike brands are betting on the older, higher-margin end of the market.

## What it means for balance bike buyers

Three takeaways:

1. **Weight is the battleground.** Every 2026 launch story is a weight story: 4.9 lb composite, 3.2 kg magnesium. The light end of the market keeps getting lighter.
2. **Frame materials are diversifying.** Steel, aluminum, composite, and magnesium are all in play now — each with a different weight, cost, and durability profile.
3. **Big brands move slowly.** Strider's nine-year gap between models means the used and mid-market segments stay relevant far longer than in most categories.

We track new launches and brand moves as they land — the [new-product channel](/news/new_product/) is the place to watch for the next one, and our [balance bikes hub](/products/balance-bikes/) compares the current field.`,
    },
    zh: {
      title: "平衡车品牌动态：2026 年 10 月",
      content: `平衡车世界今年动作不少。Strider 推出了 2017 年以来的首款新车型，Micro 的 LED 轮平衡车进入零售渠道，woom 则保持着限量配色的节奏。以下是发生了什么，以及对买家意味着什么。

## Strider：2017 年以来首款新车型

Strider Bikes 于 4 月发布了 12 Comp，目前已在 139.99 美元价位广泛有货。这是这家南达科他品牌 2017 年以来的第一款新平衡车车型——对一家实际上开创了品类的公司来说，这个间隔很长。

对买家来说是车架的新闻：尼龙复合材质，整车 4.9 磅，是 Strider 迄今最轻的 12 寸车。它定位在钢架 12 Sport 与铝架 12 Pro 之间，车把固定、座高范围更短。我们的[新品盘点](/news/new_product/new-balance-bikes-2026/)覆盖完整规格表与适配影响。

## Micro：LED 轮改用花鼓发电

Micro 的 Balance Bike Ultra LED Neochrome 被零售商列为 2026 年新款。这个噱头是真工程：花鼓发电的 LED 轮圈，不用电池。在此之下，约 3.2 公斤的镁合金车架和低横梁设计，让它进入"轻者优先"买家的备选。规格拆解见我们的[新品盘点](/news/new_product/new-balance-bikes-2026/)。

## woom：限量配色不断

woom 7 月发布了荧光青绿和荧光粉限量配色，覆盖全线，此前年初还有过 Power Pink 版。对平衡车买家，相关车型是 woom GO 1：铝架、3 公斤、12 寸轮，面向约 1.5–3.5 岁、身高 82–100 cm。限量版不改规格——但意味着当季库存轮换很快，你想要的颜色下一季可能就没了。

## woom 向上走：EXPLORE e

关注品牌动向的还值得注意：woom 3 月在全球发布了 EXPLORE e，一款面向 7–14 岁、配 MAHLE 驱动的脚踏助力电助力车。它不是平衡车，与幼儿买家无关，但它预示了品类收入的走向——成熟的童车品牌正在押注更大龄、更高毛利的那一端。

## 对平衡车买家意味着什么

三个要点：

1. **重量是战场。**2026 年每个发布故事都是重量故事：4.9 磅复合、3.2 公斤镁合金。市场的轻端越来越轻。
2. **车架材质在多样化。**钢、铝、复合、镁合金现在都在牌桌上——各有不同的重量、成本与耐久表现。
3. **大品牌动作慢。**Strider 九年才换一次代，意味着二手和中端市场的生命力比大多数品类持续得更久。

我们跟踪每一次新品发布和品牌动作——[新品频道](/news/new_product/)是看下一场发布的地方，我们的[平衡车品类页](/products/balance-bikes/)对比现役全场。`,
    },
  },
];

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const problems = [];
const fail = (id, msg) => problems.push(`${id}: ${msg}`);

const checkText = (id, field, text, { maxDesc }) => {
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

const checkSeo = (id, seo, titleBase) => {
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
    // EN title must fit the 65-char cap with the brand suffix.
    if (lang === "en" && titleBase) {
      const full = `${title} | BalanceBikeToddler`;
      if (full.length > 65) fail(id, `EN title + suffix = ${full.length} > 65`);
      if (title.length > 44) fail(id, `EN title base ${title.length} > 44`);
    }
  }
};

const checkBody = (id, en, zh, titleBase) => {
  for (const [lang, obj, min] of [["en", en, 1800], ["zh", zh, 900]]) {
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
  checkSeo(g.id, g.seo, true);
  checkBody(g.id, g.en, g.zh, true);
  if (String(g.en.title).trim() !== String(g.seo.en.title).trim()) {
    fail(g.id, "en.title and seo.en.title differ (prerender reads en.title for the <title> stem)");
  }
  if (String(g.zh.title).trim() !== String(g.seo.zh.title).trim()) {
    fail(g.id, "zh.title and seo.zh.title differ");
  }
}
for (const n of NEWS) {
  if (!/^news-[a-z0-9-]+$/.test(n.id)) fail(n.id, "id format");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(n.slug)) fail(n.id, `slug "${n.slug}" not URL-safe`);
  checkSeo(n.id, n.seo, true);
  checkBody(n.id, n.en, n.zh, true);
  if (String(n.en.title).trim() !== String(n.seo.en.title).trim()) {
    fail(n.id, "en.title and seo.en.title differ");
  }
  if (String(n.zh.title).trim() !== String(n.seo.zh.title).trim()) {
    fail(n.id, "zh.title and seo.zh.title differ");
  }
}

// Duplicate-slug guard against what is already live.
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
for (const item of [...GUIDES.map((g) => ({ c: "guides", s: g.slug, id: g.id })), ...NEWS.map((n) => ({ c: "news", s: n.slug, id: n.id }))]) {
  if (taken.has(`${item.c}:${item.s.toLowerCase()}`)) fail(item.id, `slug "${item.s}" already exists live in ${item.c}`);
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
    status: "published",
    updatedAt: new Date().toISOString(),
    taxonomy: {
      ...g.taxonomy,
      hub: "all_guides",
      hierarchyPath: [g.taxonomy.productCategory, "all_guides", g.taxonomy.topicCategory],
    },
  }));
  const news = NEWS.map((n) => ({
    ...n,
    status: "published",
    publishedAt: PUBLISHED_AT,
    updatedAt: new Date().toISOString(),
  }));

  console.log(`API base: ${API_BASE}`);
  console.log(`Mode: ${APPLY ? "APPLY (writing to D1)" : "DRY RUN"}`);
  console.log(`Guides: ${guides.length} | News: ${news.length}`);
  if (!APPLY) {
    console.log("\nDry run complete. Re-run with --apply to write.");
    return;
  }

  let ok = 0;
  let failed = 0;
  for (const item of [...guides.map((g) => ({ c: "guides", r: g })), ...news.map((n) => ({ c: "news", r: n }))]) {
    try {
      const result = await post(item.c, item.r);
      if (result.saved) {
        ok += 1;
        console.log(`[ok] ${item.c}/${item.r.slug}`);
      } else {
        failed += 1;
        console.error(`[?] ${item.c}/${item.r.slug} — response: ${result.raw}`);
      }
    } catch (error) {
      failed += 1;
      console.error(`[FAILED] ${item.c}/${item.r.slug}: ${error.message}`);
    }
  }
  console.log(`\nDone: ${ok} saved, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
