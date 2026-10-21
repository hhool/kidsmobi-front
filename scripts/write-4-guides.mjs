/**
 * Write the 4 CMS guide articles that back the footer's "Sizing & Buying Guide"
 * column (size-chart, weight, safety-standards, recalls).
 *
 * These four topics already exist as Plan-B reference assets
 * (/balance-bike-size-chart/ etc.). The articles are deliberately positioned as
 * buying-decision guides that link into the data-reference assets — different
 * intent, no cannibalization.
 *
 * Usage:
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/write-4-guides.mjs --dry-run
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/write-4-guides.mjs --apply
 *
 * CMS_API_BASE   default https://store.balancebiketoddler.com
 */
const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const API_BASE = (process.env.CMS_API_BASE || "https://store.balancebiketoddler.com").replace(/\/+$/, "");
const TOKEN = String(process.env.CMS_ADMIN_ALL_TOKEN || "").trim();

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
    id: "guide-2026-size-chart",
    slug: "balance-bike-size-chart",
    category: "beginner",
    taxonomy: { productCategory: "balance", hub: "all_guides", topicCategory: "beginner", topicOrder: 2 },
    seo: {
      en: {
        title: "Balance Bike Size Chart: Fit by Inseam",
        description:
          "How to size a balance bike by inseam instead of age: measuring, seat-height ranges, wheel size, and the growth math that decides useful life.",
        keywords: ["balance bike size chart", "balance bike inseam", "balance bike seat height", "balance bike sizing"],
      },
      zh: {
        title: "平衡车尺寸选择：按腿长适配",
        description:
          "按腿长而非年龄选平衡车：测量方法、座高区间读法、轮径取舍，以及决定一辆车能骑多久的成长算术。",
        keywords: ["平衡车尺寸", "平衡车腿长", "平衡车座高", "平衡车尺寸表"],
      },
    },
    en: {
      title: "Balance Bike Size Chart: Fit by Inseam",
      content: `Balance bikes come in more sizes than "one-size-fits-most" marketing suggests, and the single spec that decides whether a bike works is seat height. This guide covers how to measure your child, how to read a size chart, and which wheel size actually matters — the short version: the wheel is mostly a style choice; the seat range is the fit decision.

## Why inseam beats age

Two kids the same age can differ by six inches of height, and the spec that decides whether a balance bike works is the rider's inseam — the measurement from crotch to floor. A bike fits when the seat can be set so both feet rest flat on the ground with a slight knee bend. Age is a marketing shorthand; inseam is the measurement.

## How to measure (two minutes, no tape gymnastics)

1. Have your child stand barefoot against a wall, heels touching.
2. Slide a thin book between the legs, snug against the crotch, spine flat against the wall.
3. Mark where the book's underside meets the wall and measure from the floor.

That number is the inseam. For the lowest seat position, subtract 1–2 cm (about half an inch) — the rider's hips should not sit below the level where the knees can still bend through a stride.

## Reading a size chart without getting lost

A balance bike listing usually gives one of three things:

- **A single seat height.** Treat it as a starting point, not a range. Fine for a known bike; useless for predicting growth.
- **A seat height range** (e.g. "adjustable seat, 28–40 cm"). This is the number that matters. Compare the bottom of the range against your child's inseam minus the 1–2 cm clearance.
- **Only an age range.** Ask the seller for the seat range in writing. A listing that publishes no seat range is a listing that has not answered the fit question.

## The seat height target

- **Lowest seat position** should land at or just below (inseam − 1–2 cm). Any higher and the child tiptoes; much lower and the knees lock.
- **Highest seat position** should cover at least the coming 12–18 months. A seat that tops out right at today's inseam means the bike's useful life ends before the child outgrows diapers.
- **Handlebar reach** matters as much as height: the child should reach the bars without leaning forward or locking elbows. On most bikes the bars rise with the seat, so a wide seat range usually means a usable handlebar range too.

## Wheel size: the overrated spec

12-inch wheels dominate the category and suit nearly everyone. Smaller wheels (6–10 inch) appear mainly in starter bikes for younger toddlers; larger wheels are rare in balance bikes because the category's job is low-speed balance, not rolling efficiency.

Wheel size affects ground clearance and how easily the bike rolls over cracks and curbs. It does not change the fit — that is the seat's job. A 10-inch bike with the right seat height fits better than a 12-inch bike that is two inches too tall.

## Growth math: how long will this bike last

Seat ranges cluster into two useful shapes:

- **Narrow (about 8–10 cm of travel).** Typical of budget and starter bikes. Expect roughly a year of useful fit per bike.
- **Wide (12 cm or more).** Typical of mid-range and premium frames. These carry a child from first strides to pedal-bike transition.

Pedal bikes for this age group typically start with a minimum seat height around 35–38 cm, so a balance bike whose seat tops out near that mark has done its whole job.

## The five-minute check

1. Measure the inseam (book against the wall, two minutes).
2. Find the seat height range in the listing — not the age range.
3. Confirm the range bottom is at or below inseam − 1–2 cm.
4. Confirm the range top carries at least a year of growth.
5. Check that handlebar height rises with the seat (it does on most, but not all, frames).

## Where to go deeper

Our full [balance bike size chart](/balance-bike-size-chart/) compiles published seat height ranges and inseam targets by model — the data table behind this method. If you are comparing two finalists, the [price tiers guide](/guides/budget/balance-bike-price-tiers) covers what adjustment range costs at each budget level.`,
    },
    zh: {
      title: "平衡车尺寸选择：按腿长适配",
      content: `平衡车的"均码"宣传比实际情况含糊，而决定一辆车能不能用的核心规格只有一个：座高。本文讲怎么量孩子的腿长、怎么看懂尺寸表、轮径到底重不重要——先说结论：轮径基本是风格选择，座高区间才是适配决策。

## 为什么看腿长而不是年龄

同龄两个孩子的身高能差 15 厘米以上，决定平衡车是否合适的，是骑手腿长（胯到地面的距离）。车合不合适，标准是：座高能调到双脚平放地面、膝盖微屈。年龄只是营销速记，腿长才是测量值。

## 怎么量（两分钟，不需要复杂工具）

1. 孩子赤脚靠墙站直，脚跟贴墙。
2. 拿一本薄书夹在两腿之间，贴紧胯部，书脊平贴墙面。
3. 在书底缘与墙交界处做记号，量地面到记号的距离。

这个数就是腿长。最低座高在此基础上减 1–2 厘米（约半英寸）——骑手髋部不应低到膝盖无法完成滑行动作的程度。

## 怎么看懂在售页的尺寸信息

平衡车的商品页通常只给三种信息之一：

- **单一座高。**只能当起点，不是范围。对已知的车有意义，对预测成长没用。
- **座高区间**（如"可调座高 28–40 cm"）。这才是关键数字。把区间下限和孩子的腿长减 1–2 厘米对照。
- **只给年龄范围。**找卖家书面要座高区间。不敢公布座高区间的页面，等于没回答适配问题。

## 座高目标怎么定

- **最低座高**应落在腿长减 1–2 厘米处或略低。再高就踮脚；再低膝盖打直。
- **最高座高**至少要覆盖未来 12–18 个月。顶到当前腿长就封顶的车，使用期在孩子戒尿布前就结束了。
- **车把可达性**和高度一样重要：孩子应能不前倾、不锁肘地扶到车把。多数车把随座高升降，所以宽座高区间通常也意味着可用的车把区间。

## 轮径：被高估的规格

12 寸轮统治这个品类，几乎适合所有人。小轮（6–10 寸）主要出现在更小幼儿的起步车上；平衡车很少有大轮，因为这个品类的任务是低速学平衡，不是滚阻效率。

轮径影响离地高度和过裂缝、路缘的顺畅度，但不改变适配——那是座高的活。座高合适的 10 寸车，比高了两寸的 12 寸车更合身。

## 成长算术：这辆车能骑多久

座高区间聚成两种有用的形状：

- **窄（行程约 8–10 厘米）。**入门车的典型。每辆车大约一年的有效适配期。
- **宽（12 厘米以上）。**中高档车架的典型。能陪孩子从第一次滑行骑到过渡脚踏车。

这个年龄段的脚踏车通常最低座高在 35–38 厘米左右，所以座高顶到这一带的平衡车，任务已经全部完成。

## 五分钟检查清单

1. 量腿长（靠墙加书，两分钟）。
2. 在页面找座高区间——不是年龄范围。
3. 确认区间下限小于等于腿长减 1–2 厘米。
4. 确认区间上限至少撑一年成长。
5. 确认车把高度随座高升降（多数车如此，但不是全部）。

## 延伸阅读

完整的[平衡车尺寸对照表](/balance-bike-size-chart/)按型号汇总了公开座高区间与腿长目标——本文方法背后的数据。如果在两辆终选车之间犹豫，[价格档位指南](/guides/budget/balance-bike-price-tiers) 讲各预算档能买到什么调节范围。`,
    },
  },
  {
    id: "guide-2026-weight",
    slug: "balance-bike-weight",
    category: "beginner",
    taxonomy: { productCategory: "balance", hub: "all_guides", topicCategory: "beginner", topicOrder: 3 },
    seo: {
      en: {
        title: "Balance Bike Weight: Why It Matters",
        description:
          "Why frame weight decides who controls the bike: published weights by material, the third-of-body-weight guideline, and what the lightest frames trade away.",
        keywords: ["balance bike weight", "lightest balance bike", "balance bike frame material", "how much does a balance bike weigh"],
      },
      zh: {
        title: "平衡车重量：为什么轻很重要",
        description:
          "为什么车重决定谁能掌控车：按材质汇总的公开重量、三分之一体重参考线，以及最轻车架背后的取舍。",
        keywords: ["平衡车重量", "最轻平衡车", "平衡车车架材质", "平衡车有多重"],
      },
    },
    en: {
      title: "Balance Bike Weight: Why It Matters",
      content: `Balance bike listings publish weight the way cereal boxes publish fiber: everyone lists it, few buyers act on it. Weight deserves more attention than almost any other spec, because the whole point of a balance bike is that the child controls it — and every gram works against that.

## Why weight matters more here than on a pedal bike

On a pedal bike, the chain does part of the work. On a balance bike, the rider is the engine, the brakes, and the balance system. A heavier bike is harder to start, harder to steer, and harder to pick up after the inevitable first fall — and a bike the child cannot manage alone teaches them to wait for help.

The commonly used rule of thumb: the bike should weigh no more than about a third of the rider's weight, so the child can lift, carry, and right it themselves. That ratio did not come from any testing of ours — it is a widely circulated guideline, and a reasonable sanity check when comparing two bikes.

## What published weights look like

Across current manufacturer specifications:

- **Steel frames:** roughly 3.3–7.8 lb (1.5–3.5 kg). The spread is wide because steel frames are built to a price — the heavy end carries extra tubing and finish.
- **Aluminum and alloy frames:** roughly 4–7 lb, with the best-designed frames at the low end of that band.
- **Magnesium alloy:** the lightest production material in the category. One current model publishes 3.2 kg — among the lightest ride-ons on the market.
- **Nylon composite:** new to balance bikes in 2026, composite frames publish weights like 4.9 lb — aluminum-class weight at a mid-band price, with long-term durability data still accumulating.

Foam wheels add a little; pneumatic wheels with tubes add a little more; every bolt-on accessory — baskets, streamers, bolt-on pedals — adds a little again.

## The light-bike trade-offs

Weight is bought with money and, sometimes, with data:

- **Cost.** Light frames cost more to make. The lightest bikes in the category sit in the upper price band.
- **Durability evidence.** Aluminum and steel have decades of service data. Magnesium and composite are newer to this category, and their long-term fatigue behavior is still being proven in the field.
- **Repairability.** Aluminum dents and can often be re-welded; composite frames that crack are usually replaced, not repaired.

None of that means "buy the heaviest bike you can afford." It means the lightest bike at your budget is not automatically the right one — check what the weight is made of.

## When weight stops mattering (and when it never did)

- **Short, flat, supervised sessions** at a park or playground: a 3 kg difference changes little.
- **Apartments and stairs:** carrying the bike up and down daily multiplies every gram. If you will carry it, your child will eventually carry it too — or refuse to.
- **Younger starters (roughly 18–30 months):** prioritize the lightest bike that still fits, because control margins are smallest at this stage.

## Reading a weight spec properly

1. Find the published weight in the spec sheet — not the shipping weight, which includes packaging.
2. Check whether it includes wheels and seat (it should).
3. Compare against your child's weight: apply the third-of-body-weight guideline as a screen, not a law.
4. If two bikes tie on fit and price, take the lighter one. The child notices even when adults do not.

## Where to go deeper

Our [balance bike weight reference](/balance-bike-weight/) compiles published frame weights and materials by model. For how weight interacts with budget, see the [price tiers guide](/guides/budget/balance-bike-price-tiers).`,
    },
    zh: {
      title: "平衡车重量：为什么轻很重要",
      content: `平衡车的商品页公布重量的方式，就像麦片盒公布膳食纤维：人人列，没几个人当真。重量值得比几乎所有其他规格更多的关注，因为平衡车的全部意义在于孩子自己掌控车——而每一克都在跟这件事作对。

## 为什么在这里重量比脚踏车更重要

脚踏车上，链条分担一部分工作。平衡车上，骑手就是引擎、刹车和平衡系统。更重的车更难启动、更难转向、摔了之后更难扶起来——而孩子搬不动的车，教会他们的事是"等大人来帮忙"。

常用的经验法则：车重不超过骑手体重的约三分之一，孩子才搬得动、扛得动、扶得正。这个比例不是我们测出来的——它是广泛流传的参考线，在两辆车之间比较时是个合理的参照。

## 公开重量长什么样

按当前厂商规格：

- **钢架：**约 3.3–7.8 磅（1.5–3.5 公斤）。差距大是因为钢架按价格造——重的那端多了管料和涂装。
- **铝或合金车架：**约 4–7 磅，设计最好的车架落在区间低端。
- **镁合金：**品类里最轻的量产材质。一款在售车型公布 3.2 公斤——市场上最轻的骑乘玩具之一。
- **尼龙复合：**2026 年才进入平衡车，复合车架公布重量如 4.9 磅——中档价格拿到铝级重量，长期耐久数据还在积累。

发泡轮略增重；带内胎的充气轮再多一点；每加一个螺栓配件——车筐、彩带、可拆脚蹬——都再加一点。

## 轻量车的取舍

重量是用钱买来的，有时也用数据买：

- **成本。**轻车架制造成本更高，品类里最轻的车都在高价位带。
- **耐久证据。**铝和钢有几十年的使用数据；镁和复合对这个品类还新，长期疲劳表现还在实际使用中证明。
- **可修复性。**铝架磕了通常能重新焊接；复合车架开裂一般直接换，不修。

这不意味着"预算内买最重的就对了"。它的含义是：预算内最轻的车不自动是正确答案——看清这重量是用什么换的。

## 什么时候重量不再重要（以及什么时候从来没重要过）

- **短时、平地、有人看护**的公园玩闹：3 公斤差别不大。
- **公寓和楼梯：**每天上下楼搬车，每克都被放大。你会搬，孩子迟早也要搬——或者干脆不骑。
- **更小的起步骑手（约 18–30 个月）：**在合身的前提下优先最轻的车，因为这个阶段可控余量最小。

## 怎么正确读重量规格

1. 在规格表找整车重量——不是含包装的运输重量。
2. 确认含轮和座（理应含）。
3. 对照孩子体重：把三分之一法则当筛选线，不是法律。
4. 如果两辆车适配和价格打平，选轻的。孩子感觉得到，大人感觉不到。

## 延伸阅读

[平衡车重量参考页](/balance-bike-weight/)按型号汇总公开车架重量与材质。重量与预算如何互相牵制，见[价格档位指南](/guides/budget/balance-bike-price-tiers)。`,
    },
  },
  {
    id: "guide-2026-safety-standards",
    slug: "balance-bike-safety-standards",
    category: "risk",
    taxonomy: { productCategory: "balance", hub: "all_guides", topicCategory: "risk", topicOrder: 2 },
    seo: {
      en: {
        title: "Balance Bike Safety Standards Guide",
        description:
          "Which standards govern balance bikes in the US and EU — EN 71-1:2026, 16 CFR 1512, CPSIA, ASTM F963 — and how to verify a bike in five minutes.",
        keywords: ["balance bike safety standards", "EN 71-1 balance bike", "balance bike CPC", "ASTM F963 balance bike"],
      },
      zh: {
        title: "平衡车安全标准解读",
        description:
          "美欧哪些标准管平衡车——EN 71-1:2026、16 CFR 1512、CPSIA、ASTM F963——以及五分钟核查一辆车的方法。",
        keywords: ["平衡车安全标准", "EN 71-1 平衡车", "平衡车 CPC", "ASTM F963"],
      },
    },
    en: {
      title: "Balance Bike Safety Standards Guide",
      content: `Every balance bike sold legally in the US or EU has passed some set of safety rules — but "passed safety standards" can mean very different things depending on which rules apply. This guide explains which standards govern balance bikes, what each one actually covers, and how to verify a bike in five minutes.

## The four rule sets that matter

**1. EN 71-1 (EU).** The mechanical and physical half of the EU toy safety standards. The 2026 edition, distributed by CEN on 28 January 2026, gathered ride-on toys — bicycles, balance bikes, scooters — into a single clause (8.21) with eleven subclauses, five of them new tests: handlebar end impact (ten strikes per end), brake performance against force tables at 40, 50 and 60 N, handlebar stem torque (10 N·m held one minute), stabilizer strength (300 N), and saddle and seat-post security (200 N). Balance bikes also gained explicit requirements for clearance dimensions, minimum front-wheel diameter, handlebar dimensions, minimum insertion-depth marks, clamping, and stability and strength tests.

**2. 16 CFR 1512 (US, bicycles).** CPSC's bicycle rule. A balance bike with a seat height of 25 inches (63.5 cm) or less is generally treated as a "sidewalk bike" under this rule — which reduces, but does not remove, its requirements.

**3. CPSIA (US, all children's products).** Lead limits (90 ppm in paint, 100 ppm in substrate), phthalate limits, and a permanent tracking label (manufacturer, location, date, batch) apply to every children's product, including balance bikes, regardless of any bicycle standard.

**4. ASTM F963 (US, toys).** The toy safety standard, mandatory via 16 CFR 1250 since April 2024, covering small parts, sharp edges, and chemical limits. It often applies to balance bikes marketed to toddlers as toys.

## What no standard covers

Worth knowing before you treat "compliant" as "safe":

- **Chemical limits in the EU** live in the Toy Safety Directive 2009/48/EC itself, not in EN 71-1 — EN 71-1 is mechanical and physical only.
- **Durability is not tested.** Standards test new bikes under defined loads; they say nothing about how a frame survives a year of crashes, rain, and siblings.
- **Ride-on skill and supervision** are outside every standard's scope. No certificate teaches balance.

## The certificates: what to ask for

- **US: the Children's Product Certificate (CPC).** A one-page document from the manufacturer or importer citing which rules the product meets (16 CFR 1512, ASTM F963, CPSIA). Any legitimate seller can produce it.
- **EU: the Declaration of Conformity (DoC).** Cites the directive and the standard edition tested against.

Ask which **edition** of EN 71-1 a bike was certified to. From 2026 into 2027 the market is a transition window: the 2026 edition must be adopted by national standards bodies by 31 July 2026, conflicting national standards must be withdrawn by 31 July 2027, and European Commission approval — which gives the edition legal weight as a harmonized standard — is expected roughly twelve months after publication. A bike certified to the old edition is not automatically non-compliant, but it has not passed the balance-bike-specific tests the 2026 edition added.

## The five-minute verification

1. **Find the tracking label** on the frame or seat post: manufacturer, location, date, batch. No label, no trust.
2. **Ask the seller for the CPC (US) or DoC (EU)** — email is fine — and check which standards and editions it cites.
3. **Check the recall databases:** [CPSC recalls](https://www.cpsc.gov/Recalls) in the US and [EU Safety Gate](https://ec.europa.eu/safety-gate) in Europe. Our [recall record page](/guides/risk/balance-bike-recall-record) tracks both.
4. **Look for the minimum-insertion mark** on the seat post — required, and often the first thing a cheap frame skips.

## Two common misconceptions

- **"CE marked means quality tested."** CE marking is a manufacturer's declaration that legal requirements are met. It is not an award, and until EN 71-1:2026 is harmonized it references the previous edition.
- **"More expensive means more tested."** Every children's product sold legally faces the same CPSIA baseline. Price buys materials and design, not extra compliance.

## Where to go deeper

The [safety standards reference page](/balance-bike-safety-standards/) lays out the US and EU rule sets side by side with the verification steps for each. For what changed specifically in 2026, see our [standards update briefing](/news/industry/ride-on-safety-standards-2026).`,
    },
    zh: {
      title: "平衡车安全标准解读",
      content: `美国和欧盟合法销售的每一辆平衡车都通过了某套安全规则——但"通过安全标准"这件事，取决于适用的是哪套规则，含义可能天差地别。本文讲清楚哪些标准管平衡车、每套实际覆盖什么，以及怎么用五分钟核查一辆车。

## 重要的四套规则

**1. EN 71-1（欧盟）。**欧盟玩具安全标准中机械与物理的那一半。CEN 于 2026 年 1 月 28 日分发的 2026 版，把乘骑玩具——自行车、平衡车、滑板车——并入单一条款（8.21），下辖十一个子条款，其中五项是新测试：把端冲击（每端撞击十次）、按 40/50/60 牛力值表判定刹车、把立扭矩（10 N·m 保持一分钟）、辅轮强度（300 牛）、鞍座与座管安全性（200 牛）。平衡车还首次获得间隙尺寸、最小前轮径、车把尺寸、最小插入深度标记、夹紧要求以及稳定性和强度测试的明文规定。

**2. 16 CFR 1512（美国，自行车）。**CPSC 的自行车规则。座高 25 英寸（63.5 厘米）及以下的平衡车，通常按本规则归为"人行道自行车"——要求减少，但不是取消。

**3. CPSIA（美国，全部儿童产品）。**铅限值（漆层 90 ppm、基材 100 ppm）、邻苯二甲酸酯限值和永久追溯标签（厂商、产地、日期、批次）适用于包括平衡车在内的所有儿童产品，与任何自行车标准无关。

**4. ASTM F963（美国，玩具）。**玩具安全标准，自 2024 年 4 月起经 16 CFR 1250 强制适用，覆盖小零件、锐边和化学限值。作为幼儿玩具销售的平衡车通常适用。

## 没有标准覆盖的东西

把"合规"当"安全"之前值得知道：

- **欧盟的化学限值**在玩具安全指令 2009/48/EC 本身里，不在 EN 71-1——后者只管机械与物理。
- **耐久性不在测试范围。**标准测的是新车在规定载荷下的表现，不保证车架扛过一年的摔打、淋雨和兄弟姐妹。
- **骑行技能与看护**在所有标准范围之外。没有证书能教会平衡。

## 证书：该问卖家要什么

- **美国：儿童产品证书（CPC）。**厂商或进口商出具的一页纸，列明产品符合哪些规则（16 CFR 1512、ASTM F963、CPSIA）。任何正规卖家都能出具。
- **欧盟：符合性声明（DoC）。**列明指令和所依据的标准版本。

要问清 EN 71-1 认证的是**哪一版**。2026 到 2027 是过渡窗口：2026 版须在 2026 年 7 月 31 日前被各国标准机构采纳，冲突国标最晚 2027 年 7 月 31 日废止，欧盟委员会批准——那才赋予该版本协调标准的法律效力——预计在发布约十二个月后到来。按旧版认证的车不会自动不合规，但它没有通过 2026 版新增的平衡车专项测试。

## 五分钟核查

1. **找车架或座管上的追溯标签**：厂商、产地、日期、批次。没有标签，免谈。
2. **邮件问卖家要 CPC（美）或 DoC（欧）**，核对引用的标准和版本。
3. **查召回数据库：**美国查 [CPSC 召回](https://www.cpsc.gov/Recalls)，欧盟查 [EU Safety Gate](https://ec.europa.eu/safety-gate)。我们的[召回记录页](/guides/risk/balance-bike-recall-record)汇总两边数据。
4. **找座管上的最小插入深度标记**——强制项，也常是廉价车架第一个省掉的东西。

## 两个常见误解

- **"有 CE 标志就是质量认证。"**CE 标志是厂商对合法要求的自我声明，不是奖项；在 EN 71-1:2026 成为协调标准之前，它援引的是旧版。
- **"越贵测得越多。"**所有合法儿童产品面对同一套 CPSIA 底线。价格买的是材质和设计，不是额外合规。

## 延伸阅读

[安全标准参考页](/balance-bike-safety-standards/)并排列出美欧规则全集与逐项核查步骤。2026 年具体改了什么，见[标准更新简报](/news/industry/ride-on-safety-standards-2026)。`,
    },
  },
  {
    id: "guide-2026-recalls",
    slug: "balance-bike-recalls",
    category: "risk",
    taxonomy: { productCategory: "balance", hub: "all_guides", topicCategory: "risk", topicOrder: 3 },
    seo: {
      en: {
        title: "Balance Bike Recalls: A Buyer's Guide",
        description:
          "Where balance bike recalls live, how to read an announcement, and what to do when one lands on a bike you own — US and EU databases covered.",
        keywords: ["balance bike recall", "CPSC balance bike recall", "kids bike recall check", "ride-on recall database"],
      },
      zh: {
        title: "平衡车召回：买家应对指南",
        description:
          "平衡车召回信息在哪、公告怎么读、召回落到自己车上时怎么办——覆盖美国与欧盟数据库。",
        keywords: ["平衡车召回", "CPSC 平衡车召回", "童车召回查询", "骑乘玩具召回"],
      },
    },
    en: {
      title: "Balance Bike Recalls: A Buyer's Guide",
      content: `Recalls are the least glamorous part of buying a balance bike and one of the few that can affect you after the money is spent. This guide covers where recalls actually live, how to read an announcement, and what to do when one lands on a bike you own.

## Where recalls live

Two official database families cover the US and EU markets, and both are free and searchable:

- **CPSC (US).** [cpsc.gov/Recalls](https://www.cpsc.gov/Recalls) lists every recall the Consumer Product Safety Commission announces, including ride-ons and children's products. Searchable by product name, hazard, and date.
- **SaferProducts.gov (US).** The public incident-report database behind CPSC recalls. Reports here often precede formal recalls — a cluster of similar reports is frequently what triggers one.
- **EU Safety Gate.** [ec.europa.eu/safety-gate](https://ec.europa.eu/safety-gate) is the EU's rapid alert system for dangerous non-food products, covering all member states. A recall in one member state shows up here.

Our [balance bike recall record](/guides/risk/balance-bike-recall-record) compiles the EU Safety Gate feed into one filterable list, so you can check a brand or model in one place instead of reading alerts one country at a time.

## How to read a recall announcement

Recall notices follow a rough template. The fields that matter:

- **Hazard.** What can go wrong: fall, entrapment, laceration, chemical exposure, choking. This tells you how urgent the remedy is.
- **Units and sales period.** How many, and when they sold. If your bike was bought outside that window, it is usually a different unit.
- **Model name and date code.** Usually on a label under the frame, on the seat post, or molded into the plastic. This is the field that decides whether your bike is actually affected.
- **Remedy.** Refund, replacement, repair kit, or replacement part. Read it before contacting the seller — the remedy is set by the recalling company, not the retailer.
- **Recall date.** Recalls are sometimes announced years after sale; age does not exempt you.

## What to do when a recall hits a bike you own

1. **Stop using it** — not "use it carefully." The hazard description tells you why.
2. **Match the model and date code** against the announcement. Same brand, different model or year is usually not affected.
3. **Follow the remedy.** Contact the recalling company (not just the store) using the contact in the announcement. Keep the confirmation email.
4. **Document.** Photos of the label and the bike, plus the recall URL, help if a refund is disputed.
5. **Tell the gift-giver.** Grandparents and hand-me-down sources rarely see recall news; a forwarded link is a two-minute favor.

## Recalls and secondhand bikes

Garage sales, marketplace listings, and hand-me-downs are the most common way a recalled bike stays in use. Before buying secondhand:

- Search the model name plus "recall" — CPSC's site is the fastest check.
- Ask for a photo of the date code before you drive over.
- If the bike was recalled and the remedy was completed, ask for proof (repair receipt, replacement part).

## What a recall does and does not mean

A recall is not a verdict on a brand. Design defects get recalled; so do manufacturing batches — one bad production run on an otherwise sound model. Read the hazard description: "steering column can break, posing a fall hazard" is a different problem from "paint exceeds lead limit," and they carry different urgency for a bike your child rides today.

## Staying ahead without effort

- **Subscribe to CPSC recall emails** on cpsc.gov — filtered to children's products if you want.
- **Check the model once** when the bike arrives, and again if you register it with the manufacturer (registration is how companies reach owners directly).
- **Bookmark the recall record page** — it tracks the EU feed, which CPSC subscribers miss.

## Where to go deeper

The [recall record page](/guides/risk/balance-bike-recall-record) lists recalled ride-ons with hazard and remedy fields, filterable by brand. For the standards side of safety — what rules a bike passed before it ever shipped — see the [safety standards guide](/guides/risk/balance-bike-safety-standards).`,
    },
    zh: {
      title: "平衡车召回：买家应对指南",
      content: `召回是买平衡车最不光鲜的环节，也是少数几个钱花完之后还能影响你的事。本文讲召回信息实际藏在哪、公告怎么读、以及召回落到你家的车头上时该做什么。

## 召回信息藏在哪

两个官方数据库体系覆盖美欧市场，都免费可查：

- **CPSC（美国）。**[cpsc.gov/Recalls](https://www.cpsc.gov/Recalls) 列出美国消费品安全委员会宣布的每一条召回，含骑乘玩具和儿童产品，可按品名、危害、日期检索。
- **SaferProducts.gov（美国）。**CPSC 召回背后的公开事故报告库。这里的报告常常走在正式召回前面——相似报告的聚集，往往就是召回的触发因。
- **EU Safety Gate。**[ec.europa.eu/safety-gate](https://ec.europa.eu/safety-gate) 是欧盟非食品类危险产品快速警报系统，覆盖所有成员国。一个成员国发生的召回会出现在这里。

我们的[平衡车召回记录页](/guides/risk/balance-bike-recall-record)把 EU Safety Gate 数据流汇总成一个可筛选列表，查品牌或型号一次到位，不用逐国读警报。

## 召回公告怎么读

召回公告有个大致模板。关键字段：

- **危害（Hazard）。**可能出什么事：摔倒、卡夹、割伤、化学暴露、窒息。它决定补救的紧迫程度。
- **数量与销售期。**卖了多少、什么时候卖的。你的车若在这个窗口外买入，通常是另一批。
- **型号与日期码。**通常在车架下方标签、座管上或注塑在塑料里。这个字段决定你的车是否真的在范围内。
- **补救方式（Remedy）。**退款、换货、维修套件或更换配件。联系卖家前先读它——补救由召回企业定，不是零售商定。
- **召回日期。**召回有时在售出数年后才宣布，车老不等于豁免。

## 召回落到自己车上时怎么办

1. **停用**——不是"小心着骑"。危害描述会告诉你为什么。
2. **对照型号和日期码**与公告。同品牌不同型号或年份，通常不在范围内。
3. **按补救方式执行。**用公告里的联系方式找召回企业（不只是商店）。保留确认邮件。
4. **留证据。**标签和车的照片加召回链接，退款有争议时用得上。
5. **告诉送你车的人。**祖辈和转赠来源基本看不到召回新闻，转发一条链接是两分钟人情。

## 召回与二手车

旧货出售、二手平台和转赠，是问题车留在使用中的最常见路径。买二手前：

- 搜"型号加召回"——CPSC 网站是最快的检查。
- 上门之前先要日期码照片。
- 如果车曾召回且补救已完成，要证明（维修收据、更换配件）。

## 召回意味着什么、不意味着什么

召回不是对一个品牌的判决。设计缺陷会被召回，制造批次也会——一个本来没问题的型号撞上一次不良生产批次。读危害描述："转向柱可能断裂，造成摔倒危险"和"漆层铅含量超标"是不同的问题，对你孩子今天骑的车，紧迫性也不同。

## 不费力地保持知情

- **订阅 CPSC 召回邮件**（cpsc.gov）——想聚焦儿童产品可以过滤。
- **车到手时查一次型号**，注册产品后再查一次（注册是厂商直接触达车主的方式）。
- **收藏召回记录页**——它跟踪欧盟数据流，这是 CPSC 订阅者覆盖不到的。

## 延伸阅读

[召回记录页](/guides/risk/balance-bike-recall-record)按品牌筛选列出被召回的骑乘玩具及危害与补救字段。安全的标准面——车出厂前通过了什么规则——见[安全标准指南](/guides/risk/balance-bike-safety-standards)。`,
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
for (const item of GUIDES) {
  if (taken.has(`guides:${item.slug.toLowerCase()}`)) fail(item.id, `slug "${item.slug}" already exists live in guides`);
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

  console.log(`API base: ${API_BASE}`);
  console.log(`Mode: ${APPLY ? "APPLY (writing to D1)" : "DRY RUN"}`);
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
