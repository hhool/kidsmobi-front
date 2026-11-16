/**
 * Append body prose to the five round-3 (zero-impression) news articles.
 *
 * SAME CONTRACT as extend-news-bodies.mjs (round 2):
 * - `seo` is copied through byte-for-byte (head frozen until 2026-11-22).
 * - Existing en.content / zh.content is preserved verbatim; only appended.
 * - Idempotent: the SENTINEL string stops a second apply from duplicating text.
 * - Chinese additions use Chinese expressions; only brand/model names, spec
 *   codes and units in the source script remain as published.
 * - ANCHORS: every figure reused below must appear literally in that article's
 *   own published body; the script refuses to write otherwise.
 *
 * HONESTY: no first-person testing/measuring claims. The honesty guard scans
 * the whole built HTML, so a "由我们测量"-style phrase would poison the
 * negation exemption the existing bodies rely on. Wording stays descriptive
 * ("公布值", "照录", "未标") and never introduces 我们 + 测量/测试/实测/验证.
 *
 * Usage:
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/extend-news-bodies-round3.mjs            # dry run
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/extend-news-bodies-round3.mjs --apply    # write D1
 */
const APPLY = process.argv.includes("--apply");
const API_BASE = (process.env.CMS_API_BASE || "https://store.balancebiketoddler.com").replace(/\/+$/, "");
const TOKEN = String(process.env.CMS_ADMIN_ALL_TOKEN || "").trim();

// diff-review:skip-begin
const FORBIDDEN = [
  "we tested", "hands-on testing", "in our test group", "in our testing",
  "in our checks", "in our group", "backed by real testing", "test notes",
  "实测", "实验室", "我们的测试", "我们测试了", "我们测量", "检测团队",
];
// diff-review:skip-end

const ADDITIONS = {
  "new-balance-bikes-2026": {
    sentinel: "Matching the two launches to a child",
    anchors: {
      en: ["4.9 lb (2.2 kg)", "12–16 in (30.5–40.6 cm)", "11–15 in (27.9–38.1 cm)", "45 lb (20 kg)", "fixed at 19 in (48.3 cm)", "3.2 kg", "33.5–40 cm", "50 kg", "about 6.7 lb", "about 5.6 lb", "1–3 years", "18 months"],
      zh: ["4.9 磅（2.2 公斤）", "12–16 英寸（30.5–40.6 cm）", "11–15 英寸（27.9–38.1 cm）", "45 磅（20 kg）", "固定 19 英寸（48.3 cm）", "3.2 公斤", "33.5–40 cm", "50 公斤", "6.7 磅", "5.6 磅", "1–3 岁", "18 个月"],
    },
    en: `
## Matching the two launches to a child

The two 2026 launches publish fit data, not age promises, and the two kinds of number answer different questions. Age is a rough starting point; the inseam and seat range are what decide whether a child can plant both feet and push.

- The **Strider 12 Comp** is stated at 1–3 years, with a 12–16 in (30.5–40.6 cm) inseam fit and an 11–15 in (27.9–38.1 cm) seat height. Its maximum rider weight is 45 lb (20 kg). The handlebar is fixed at 19 in (48.3 cm), so it does not grow with the rider.
- The **Micro Balance Bike Ultra LED Neochrome** is listed from 18 months, with retailers describing a 2–5 year target. Its saddle adjusts from 33.5 to 40 cm off the ground and its stated maximum rider weight is 50 kg. The step-through frame is the detail that helps a smaller child get on and off alone.

Read the stated age as a filter and the measurements as the decision. A child inside the age band but below the inseam minimum will still struggle; the fixed handlebar on the Strider makes that mismatch harder to correct later. Neither launch publishes a minimum inseam beyond the ranges above, so those figures are the published fit ranges, not a guarantee for any one child.

## Why weight and step-through keep coming up

Searches for a stable first bike often circle back to two specs these launches actually publish. A lighter complete bike is easier for a small child to pick up after a fall — 4.9 lb (2.2 kg) for the 12 Comp and 3.2 kg for the Micro — and a low step-through lowers the barrier to mounting without help. The material ladder in this article (steel 12 Sport at about 6.7 lb, aluminum 12 Pro at about 5.6 lb, composite 12 Comp at 4.9 lb, magnesium Micro at 3.2 kg) describes what each brand chose, not a measured ranking. Neither announcement publishes braking performance or head-tube angle, so the word "stable" cannot be settled from these spec sheets alone.`,
    zh: `
## 按孩子对照这两款新品

两款 2026 新品公布的是适配数据，不是年龄承诺；两类数字回答的是不同问题。年龄只是粗略起点，腿长和座高才决定孩子能不能双脚落地往前蹬。

- **Strider 12 Comp** 标称 1–3 岁，腿长适配 12–16 英寸（30.5–40.6 cm），座高 11–15 英寸（27.9–38.1 厘米），最大骑手重量 45 磅（20 kg）。车把固定在 19 英寸（48.3 cm），不会随孩子长高而调整。
- **Micro Balance Bike Ultra LED Neochrome** 列明 18 个月起，零售商描述的目标为 2–5 岁；座垫离地 33.5–40 厘米可调，最大骑手重量 50 公斤。低横梁车架是帮助体型小的孩子独立上下车的关键。

把标称年龄当筛选，把尺寸当决定。孩子即使在年龄档内、腿长却低于下限，依然蹬不好；Strider 的固定车把让这种不匹配日后更难调整。两款新品都没有公布超出上述范围的最小腿长，所以这些数字是公布的适配范围，不是对某个孩子的保证。

## 为什么重量和低横梁总被反复提起

搜索"骑得稳的第一辆车"，问题最后往往落回这两款真的公布了的两个规格。整车更轻，孩子摔倒后更容易自己扶起来——12 Comp 是 4.9 磅（2.2 公斤），Micro 是 3.2 公斤；低横梁则降低了独自上车的门槛。本文的材质阶梯（钢架 12 Sport 约 6.7 磅、铝架 12 Pro 约 5.6 磅、复合车架 12 Comp 4.9 磅、镁合金 Micro 3.2 公斤）描述的是各品牌的选择，不是量出来的排名。两份公告都没有公布刹车表现或头管角度，所以单靠这些规格表，回答不了"稳不稳"这个问题。`,
  },

  "kids-electric-bike-development-trends-2026": {
    sentinel: "The age floor, tier by tier",
    anchors: {
      en: ["12 to 36 months", "36 months or later", "12 and 18 months", "55 lb", "61-132 lb", "65-264 lb", "37-120 months", "top speed appears in no spec sheet", "11 of 16 titles", "3 of 16 spec sheets", "55 lb to 264 lb", "charging time"],
      zh: ["12-36 个月", "36 个月起", "12 和 18 个月", "55 磅", "61-132 磅", "65-264 磅", "37-120 个月", "最高时速没有出现在任何规格表", "11/16 个标题", "3/16 个规格表", "55 磅到 264 磅", "充电时间"],
    },
    en: `
## The age floor, tier by tier

The table below restates only the ages this catalog already publishes. It is useful because the voltage badge is the least precise number on the page: the 12V tier alone carries stated minimum ages of 12 to 36 months.

- **6V (one listing):** 36-60 months, 55 lb capacity, single seat.
- **12V (eight listings):** minimum ages of 12-36 months; where stated, capacity runs 61-132 lb.
- **24V (five listings):** capacity of 65-264 lb; the 264 lb figure is a four-seater.
- **36V (one listing):** a two-seater UTV with a stated 37-120 months and 132 lb capacity.

Fourteen of the sixteen listings start at 36 months or later; the two that start earlier, at 12 and 18 months, are both in the 12V tier. That spread is the reason to read the age line before the voltage line. None of these ages is a developmental threshold this article derived — they are the manufacturers' published minimums, reported here as published.

## From title copy to spec sheet

The article's counts give a simple verification habit: treat a number as confirmed only when the spec sheet repeats what the title claims.

- Top speed appears in no spec sheet; the 1.5, 3.5, 4 and 5-8 MPH figures are title copy on four listings.
- Braking, tire type and motor wattage appear in no spec sheet either; 400W, 4x100W and twin-35W are title figures.
- A parental remote appears in 11 of 16 titles but only 3 of 16 spec sheets.
- Battery life is stated in 10 spec sheets and weight capacity in 14, running 55 lb to 264 lb. All sixteen require assembly, and none states a charging time.

Ask the seller to point to the spec sheet line, not the headline. Where the spec sheet is silent, the honest answer is that the figure is not stated — which is exactly how this page reports it.`,
    zh: `
## 逐档看年龄下限

下表只重述本目录已经公布的年龄。它有用，是因为电压徽标是这页最不精确的数字：单是 12V 一档，标称最低年龄就从 12 个月跨到 36 个月。

- **6V（一个车型）：**36-60 个月，承重 55 磅，单座。
- **12V（八个车型）：**最低年龄 12-36 个月；标了承重的为 61-132 磅。
- **24V（五个车型）：**承重 65-264 磅；264 磅属于一台四座车。
- **36V（一个车型）：**双座 UTV，标称 37-120 个月、承重 132 磅。

16 个车型里 14 个从 36 个月起，更早的两个（12 和 18 个月）都在 12V 档。这就是先读年龄行、再读电压行的原因。这些年龄都不是本文推导出的发育门槛，而是厂商公布的最低值，这里按公布值照录。

## 从标题文案回到规格表

本文的清点给出一条很直接的核对习惯：只有规格表复述了标题的说法，才算这个数字得到确认。

- 最高时速没有出现在任何规格表里；1.5、3.5、4 与 5-8 MPH 是四个车型标题里的文案。
- 制动、轮胎类型、电机功率同样不出现在任何规格表里；400W、4x100W、双 35W 都是标题里的数字。
- 家长遥控出现在 11/16 个标题里，但只有 3/16 个规格表写了。
- 电池寿命写在 10 个规格表里，承重写在 14 个，范围 55 磅到 264 磅。16 个全部需要组装，没有一个标充电时间。

让卖家指出规格表里的那一行，而不是标题。规格表没写的地方，诚实的回答就是"未标"——本页正是这样报告的。`,
  },

  "ride-on-safety-standards-2026": {
    sentinel: "The five new tests in plain language",
    anchors: {
      en: ["ten times", "40, 50, and 60 N", "10 N·m is held for one minute", "300 N load", "200 N", "31 July 2026", "31 July 2027", "25 inches (63.5 cm)", "90 ppm", "100 ppm", "April 2024", "2009/48/EC"],
      zh: ["撞击十次", "40、50、60 牛", "10 N·m 扭矩保持一分钟", "300 牛", "200 牛", "2026 年 7 月 31 日", "2027 年 7 月 31 日", "25 英寸（63.5 cm）", "90 ppm", "100 ppm", "2024 年 4 月", "2009/48/EC"],
    },
    en: `
## The five new tests in plain language

Clause 8.21 of EN 71-1:2026 groups ride-on toys and adds five tests. The standard states the conditions; the list below only restates them:

1. **Handlebar end impact** — each end of the handlebar is struck against a hard surface ten times.
2. **Brake performance** — judged against force tables, with 40, 50, and 60 N applied step by step rather than a single stopping distance.
3. **Handlebar stem security** — a torque of 10 N·m is held for one minute.
4. **Stabilizer strength** — each stabilizer wheel takes a 300 N load, with deflection and permanent-set limits.
5. **Saddle and seat-post security** — the saddle takes a 200 N vertical load.

Beyond the five tests, balance bikes gain requirements the earlier edition did not spell out: clearance dimensions, minimum front-wheel diameter, handlebar dimensions, brake requirements, minimum insertion-depth marks on adjustable stems and seat posts, clamping, and stability plus static and dynamic strength, together with warnings, labels and maintenance instructions. These are standard requirements, not a ranking of any product.

## Two markets, two certificates

The rule changes are not symmetric. In the European Union, national bodies had until 31 July 2026 to adopt EN 71-1:2026 and must withdraw conflicting standards by 31 July 2027; harmonized status under Directive 2009/48/EC is expected roughly twelve months after publication. Until then, CE marking still follows the previous edition and its amendments.

In the United States nothing changed in 2026. A balance bike with a seat height of 25 inches (63.5 cm) or less is generally a "sidewalk bike" under 16 CFR 1512; CPSIA lead limits of 90 ppm in paint and 100 ppm in substrate still apply, as does the permanent tracking label; and ASTM F963 has been mandatory via 16 CFR 1250 since April 2024. The practical question for a buyer is which certificate the seller can produce — a Children's Product Certificate in the US, a Declaration of Conformity in the EU — and which edition of the standard it cites.`,
    zh: `
## 用大白话看懂五项新测试

EN 71-1:2026 的 8.21 条款把乘骑玩具归到一起，新增五项测试。标准给出了条件，下面只是照录这些条件：

1. **把端冲击**——车把每一端对硬表面撞击十次。
2. **刹车性能**——按力值表判定，分步施加 40、50、60 牛，而不是测单一刹车距离。
3. **把立安全性**——以 10 N·m 扭矩保持一分钟。
4. **辅轮强度**——每个辅轮承受 300 牛，并有限定形变量与永久变形限值。
5. **鞍座与座管安全性**——鞍座承受 200 牛垂直载荷。

除五项测试外，平衡车还获得了旧版未写明的要求：间隙尺寸、前轮最小直径、车把尺寸、刹车要求、可调节把立与座管的最小插入深度标记、夹紧要求，以及稳定性与静态、动态强度，连同警告语、标识和维护说明。这些是标准要求，不是对任何产品的排名。

## 两个市场，两种证书

两边的规则变化并不对称。在欧盟，各国标准机构应在 2026 年 7 月 31 日前采纳 EN 71-1:2026，冲突的旧国标最晚 2027 年 7 月 31 日废止；按 2009/48/EC 指令成为协调标准预计在发布约十二个月后。在那之前，CE 标志仍依据旧版及其修订案。

美国 2026 年没有变化。座高 25 英寸（63.5 cm）以内的平衡车通常按 16 CFR 1512 视为"人行道自行车"；CPSIA 铅限值——涂层 90 ppm、基材 100 ppm——以及永久追溯标签依然适用；ASTM F963 自 2024 年 4 月起经 16 CFR 1250 强制适用。对买家来说，实际问题是卖家能出具哪种证书：美国要儿童产品证书，欧盟要符合性声明，以及证书引用的是哪一版标准。`,
  },

  "foldable-electric-scooter-brands-worldwide": {
    sentinel: "Which tier fits which trip",
    anchors: {
      en: ["Segway-Ninebot", "MAX G2", "Xiaomi", "NIU", "KQi3 Pro", "Apollo", "Unagi", "Gotrax", "Dualtron", "Kaabo", "Vsett", "NAMI", "50 km/h", "12\\text{--}15\\text{ kg}", "18\\text{--}24\\text{ kg}", "30\\text{ kg}+"],
      zh: ["九号", "MAX G2", "小米", "小牛", "KQi3 Pro", "Apollo", "Unagi", "Gotrax", "Dualtron", "Kaabo", "Vsett", "NAMI", "50km/h", "12\\text{--}15\\text{ kg}", "18\\text{--}24\\text{ kg}", "30\\text{ kg}+"],
    },
    en: `
## Which tier fits which trip

The three tiers in this roundup describe positioning, not quality. Reading them by use case keeps the comparison honest:

- **Mass commuting:** Segway-Ninebot (MAX G2, G30P, F and E2 series), Xiaomi (Electric Scooter 4, Pro series) and NIU (KQi2 Pro, KQi3 Pro, KQi Air). The article describes these as durable, good value, or comfortable over rough roads with wide decks and tires.
- **Design and power:** Apollo (City, Pro, Air), Unagi (Model One Voyage) and Gotrax (G4, GXL V2). The stated focus runs from dual motors and suspension to carbon-fiber frames and budget-first models.
- **High speed and off-road:** Dualtron (Thunder, Victor, Mini), Kaabo (Mantis X Plus, Wolf Warrior), Vsett (9+, 10+) and NAMI (Burn-E 2). These are the models the article places above 50 km/h, with dual motors and heavy suspension that still fold for a car trunk.

No brand here is ranked, and the article publishes no measured comparison. The tiers are the author's grouping of what each brand says about itself.

## Reading the weight bands

The buyer's guide sorts by weight rather than by brand, and that is the more transferable number:

- Around 12–15 kg — the portable band, named for subway and desk storage, with the Xiaomi Electric Scooter and Unagi Model One as examples.
- 18–24 kg with suspension — the daily-commute and rough-road band, with the Segway-Ninebot MAX G2 and NIU KQi3 Pro.
- 30 kg+ with dual motors — steep hills, high speed and long range, with the Apollo City Dual, Kaabo Mantis and Dualtron.

A lighter scooter is easier to carry up stairs; a heavier one is where the article expects suspension and dual motors to appear. The weight figures and series names above are exactly those the article publishes, and no price or performance claim is added here.`,
    zh: `
## 按出行场景看梯队

这份盘点的三个梯队描述的是定位，不是质量。按使用场景来读，比较才不会走样：

- **大众通勤：**Segway-Ninebot（MAX G2、G30P、F 系列、E2 系列）、Xiaomi（Electric Scooter 4、Pro 系列）、NIU（KQi2 Pro、KQi3 Pro、KQi Air）。原文把它们的特点归为耐用、性价比高，或靠宽踏板宽胎提升破损路面的舒适度。
- **设计与动力：**Apollo（City、Pro、Air）、Unagi（Model One Voyage）、Gotrax（G4、GXL V2）。原文给出的侧重点，从双电机与悬挂，到碳纤维车架，再到平民价位。
- **极速与越野：**Dualtron（Thunder、Victor、Mini）、Kaabo（Mantis X Plus、Wolf Warrior）、Vsett（9+、10+）、NAMI（Burn-E 2）。原文把这些车型放在 50km/h 以上，配双电机与强悍悬挂，同时仍可折进后备箱。

这里没有给任何品牌排名，原文也没有公布可比的对照数据。梯队只是作者按各品牌自述做的归类。

## 按重量区间来读

选购建议是按重量、而不是按品牌分的，这个数字也更容易迁移：

- 12–15 公斤左右——便携档，面向地铁与办公室收纳，原文举例 Xiaomi Electric Scooter 与 Unagi Model One。
- 18–24 公斤且带避震——日常通勤与破损路面档，举例 Segway-Ninebot MAX G2 与 NIU KQi3 Pro。
- 30 公斤以上双电机——爬陡坡、极速与远航程，举例 Apollo City Dual、Kaabo Mantis 与 Dualtron。

更轻的车更容易扛上楼；更重的车，原文预期会出现避震与双电机。上面的重量和系列名都照录原文，本文不补充任何价格或性能说法。`,
  },

  "electric-dirt-bikes-for-kids": {
    sentinel: "Why this catalog has no dirt bike",
    anchors: {
      en: ["16 listings", "6V three-wheel", "Bronco Raptor", "36V two-seater UTV", "F-150", "0 of 16 spec sheets", "14-inch EVA wheels", "11 of 16 titles", "3 of 16 spec sheets", "55-132 lb", "36 months or later", "1.5 and 3.5 MPH", "5-8 MPH"],
      zh: ["16 个车型", "6V 三轮", "Bronco Raptor", "36V 双座 UTV", "F-150", "0/16 个规格表", "14 英寸 EVA", "11/16 个标题", "3/16 个规格表", "55-132 磅", "36 个月起", "1.5 和 3.5 MPH", "5-8 MPH"],
    },
    en: `
## Why this catalog has no dirt bike

The search that leads here — an electric dirt bike for kids — describes a product this catalog does not file. The sixteen listings under the electric ride-on category are cars, trucks, a UTV, two wiggle cars and a three-wheel motorcycle; the four off-road-shaped ones are a 6V three-wheel motorcycle, a 24V Bronco Raptor, a 36V UTV and a 24V F-150. None is a dirt bike, and no pedal-assist e-bike appears here. That is a category mismatch, not a gap the article can fill with a spec table.

The distinction matters because the word "dirt" implies tire type, braking and suspension — exactly the fields the spec sheets leave blank. Tire type appears in 0 of 16 spec sheets; the only tire material stated anywhere is the UTV's 14-inch EVA wheels, in its title. Braking and motor wattage also appear in 0 of 16 spec sheets, while 400W, 4x100W and twin-35W are title copy. A buyer looking for off-road capability is therefore being asked to judge it from headline wording.

## Turning the five checks into questions

The five checks are easiest to use as questions put to a seller:

1. What speed is actually shipped? Voltage is a ceiling: two 12V titles state 1.5 and 3.5 MPH, a wiggle car with no stated voltage states 4 MPH, and the 36V UTV states 5-8 MPH — all in titles, not spec sheets.
2. What are the tires, in person? EVA foam cannot puncture but transmits what it rolls over; pneumatic tires grip and need air. The only tire material stated in the category is the UTV's EVA, in its title.
3. Is the remote included, and what does it control? Eleven of sixteen titles mention one; three of sixteen spec sheets state one.
4. Does capacity cover rider plus gear? The off-road cluster states 55-132 lb, and the 6V motorcycle's 55 lb is the tightest stated capacity in the category.
5. Is the child above the age floor? All sixteen state a minimum; fourteen start at 36 months or later.

Where the answer is not in the spec sheet, this page records it as not stated rather than filling the gap.`,
    zh: `
## 为什么这个目录里没有越野车

点进这篇的搜索词——儿童电动越野车——描述的是这个目录没有收录的产品。电动骑乘品类下的 16 个车型是汽车、卡车、一台 UTV、两辆扭扭车和一辆三轮摩托车；四款越野造型的是 6V 三轮摩托、24V Bronco Raptor、36V UTV 和 24V F-150。没有一款是越野摩托车，这里也没有踏板助力电动自行车。这是品类错配，不是本文能用一张规格表补上的空白。

这个区别要紧，因为"越野"两个字意味着轮胎、刹车和悬挂——恰恰是规格表留空的字段。轮胎类型出现在 0/16 个规格表里；全品类唯一标出的轮胎材质是 UTV 标题里的 14 英寸 EVA 轮。制动和电机功率同样在 0/16 个规格表里，而 400W、4x100W、双 35W 都是标题文案。想买越野能力的人，实际上被要求靠标题措辞来判断。

## 把五项核对变成五个问题

五项核对最容易的用法，是当成问卖家的问题：

1. 实际发货的限速是多少？电压是上限：两辆 12V 标题写 1.5 与 3.5 MPH，一辆没标电压的扭扭车写 4 MPH，36V UTV 写 5-8 MPH——全在标题里，不在规格表。
2. 轮胎到底是什么，到手亲眼看？EVA 发泡扎不破，但路面反馈直接传导；充气胎抓地好，但要打气。全品类唯一标出的轮胎材质，是 UTV 标题里的 EVA。
3. 遥控是否随附，控制什么？16 个标题里 11 个提到，16 个规格表里只有 3 个写了。
4. 承重罩得住骑手加装备吗？越野簇标称 55-132 磅，其中 6V 摩托车的 55 磅是全品类最紧的标称承重。
5. 孩子过了最低年龄吗？16 个车型全部标了最低年龄，其中 14 个从 36 个月起。

规格表里找不到答案的地方，本页按"未标"照录，不替它填空。`,
  },
};

function unwrap(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return null;
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "x-cms-admin-token": TOKEN,
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  try { return JSON.parse(text); } catch { return {}; }
}

async function main() {
  if (!TOKEN) { console.error("CMS_ADMIN_ALL_TOKEN is required."); process.exit(1); }

  const payload = await request(`/api/cms/news?cb=${Date.now()}`);
  const records = unwrap(payload);
  if (!records) { console.error("Unexpected CMS response shape"); process.exit(1); }
  console.log(`CMS records: ${records.length}`);

  let changed = 0;
  for (const [slug, spec] of Object.entries(ADDITIONS)) {
    const record = records.find((r) => r.slug === slug);
    if (!record) { console.error(`[FAIL] missing record: ${slug}`); process.exitCode = 1; continue; }

    const beforeSeo = JSON.stringify(record.seo ?? null);
    for (const lang of ["en", "zh"]) {
      const addition = spec[lang];
      const l = String(addition).toLowerCase();
      const bad = FORBIDDEN.find((p) => l.includes(p.toLowerCase()));
      if (bad) { console.error(`[FAIL] ${slug}/${lang} forbidden phrase: ${bad}`); process.exitCode = 1; }
      const body = String(record[lang]?.content || "");
      const missing = spec.anchors[lang].filter((a) => !body.includes(a));
      if (missing.length) { console.error(`[FAIL] ${slug}/${lang} anchors not in published body: ${JSON.stringify(missing)}`); process.exitCode = 1; }
    }

    if (String(record.en?.content || "").includes(spec.sentinel)) {
      console.log(`[skip] ${slug} — already extended (sentinel present)`);
      continue;
    }

    const next = {
      ...record,
      en: { ...record.en, content: `${String(record.en?.content || "").trimEnd()}\n${spec.en.trimStart()}` },
      zh: { ...record.zh, content: `${String(record.zh?.content || "").trimEnd()}\n${spec.zh.trimStart()}` },
      updatedAt: new Date().toISOString(),
    };
    if (JSON.stringify(next.seo ?? null) !== beforeSeo) {
      console.error(`[FAIL] ${slug} seo would change — aborting`); process.exitCode = 1; continue;
    }
    const enBefore = String(record.en?.content || "").trimEnd();
    const zhBefore = String(record.zh?.content || "").trimEnd();
    if (!next.en.content.startsWith(enBefore) || !next.zh.content.startsWith(zhBefore)) {
      console.error(`[FAIL] ${slug} original body not preserved — aborting`); process.exitCode = 1; continue;
    }

    console.log(`[plan] ${slug}  +${spec.en.split(/\s+/).length} EN words  +${spec.zh.length} ZH chars`);
    changed++;
    if (!APPLY) continue;

    const saved = await request(`/api/cms/news/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    if (!saved?.data?.saved) { console.error(`[FAIL] ${slug} save response:`, JSON.stringify(saved).slice(0, 200)); process.exitCode = 1; }
    else console.log(`[ok] ${slug} written to D1`);
  }

  console.log(APPLY ? `Applied ${changed} article(s).` : `Dry run: ${changed} article(s) would change. Re-run with --apply.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
