/**
 * Append body prose to the four news articles selected in the 2026-11-16 review.
 *
 * WHY A CMS WRITE
 * ---------------
 * The 2026-11-16 enrichment shipped panels only. This script lengthens the
 * article BODY itself — the part search engines read as the article — using
 * the admin token the owner supplied. Every added sentence restates a fact the
 * same article already publishes, plus the GSC search language we observed.
 *
 * HARD RULES
 * ----------
 * - `seo` is copied through byte-for-byte (head is frozen until 2026-11-22).
 * - Existing `en.content` / `zh.content` is preserved verbatim; only appended.
 * - Idempotent: the SENTINEL string stops a second apply from duplicating text.
 * - Chinese additions use Chinese expressions; only brand/model names remain
 *   in their original script. Units are 英寸 / 磅 / 公斤 / 厘米.
 *
 * Usage:
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/extend-news-bodies.mjs            # dry run
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/extend-news-bodies.mjs --apply    # write D1
 */
const APPLY = process.argv.includes("--apply");
const API_BASE = (process.env.CMS_API_BASE || "https://store.balancebiketoddler.com").replace(/\/+$/, "");
const TOKEN = String(process.env.CMS_ADMIN_ALL_TOKEN || "").trim();

// diff-review:skip-begin
const FORBIDDEN = [
  "we tested", "hands-on testing", "in our test group", "in our testing",
  "in our checks", "in our group", "backed by real testing", "test notes",
  "实测", "实验室", "我们的测试", "我们测试了", "检测团队",
];
// diff-review:skip-end

const ADDITIONS = {
  "balance-bike-brand-news-october-2026": {
    sentinel: "Reading the 2026 launches by age and fit",
    en: `
## Reading the 2026 launches by age and fit

Search demand in this category is dominated by age-qualified queries — a balance bike for a 2 year old, the best balance bike for a 3 year old, and similar — but the launches above publish wheel size and rider measurements, not age bands. The useful comparison is therefore the published fit data, not a marketing age label.

- **woom GO 1** publishes the clearest range in this roundup: 12-inch wheels, about 3 kg, and a stated 82–100 cm rider height for roughly 1.5 to 3.5 years. It is the only launch here that gives both a height range and an age range.
- **Strider 12 Comp** is also a 12-inch bike, at 4.9 lb with a nylon-composite frame and a fixed handlebar. The announcement does not state a rider-height band for it, so an age claim would go beyond the source.
- **Micro Balance Bike Ultra LED Neochrome** is described with an approximate 3.2 kg magnesium frame and a low step-through design. For a smaller rider, the step-through is the relevant detail, not the LED rims.
- **woom EXPLORE e** is a pedal-assist bike for ages 7–14. It is not a balance bike and should not be compared on toddler fit criteria.

Search language that stresses a "stable track" points to the same underlying questions: wheel size, step-through height and total weight. This article publishes all three for the models above except the Strider's rider-height band, which is not stated.

## What changed in materials, in order

The launches map to three frame materials, each with a different published weight:

1. Steel — the 12 Sport, which the 12 Comp slots under.
2. Aluminum — the 12 Pro and the woom GO 1 at 3 kg.
3. Nylon composite — the 12 Comp at 4.9 lb, described as the lightest 12-inch Strider to date.
4. Magnesium — the Micro at about 3.2 kg.

These are the manufacturers' published figures, not a like-for-like measurement: the frames also differ in geometry. Read the order as a description of what each brand chose, not as a performance ranking.

## What this article does not settle

None of these launch notes publishes braking performance, head-tube angle or a minimum inseam for the 12 Comp. The limited-edition colors do not change the woom GO 1's specs, but they do rotate stock, so availability varies by season. For the fit measurements these announcements omit, use the balance bike by age guide linked below.`,
    zh: `
## 按年龄和适配读 2026 年的新品

这个品类的搜索需求大量带年龄修饰——两岁平衡车、三岁最佳平衡车等等——但上面这些新品公布的是轮径和骑手尺寸，并不是年龄档。真正可比的，是已公布的适配数据，而不是营销用的年龄标签。

- **woom GO 1** 是本轮里适配信息最完整的一款：12 英寸轮径、约 3 公斤，并给出约 82–100 厘米的身高区间，对应约 1.5 至 3.5 岁。这是本次唯一同时给出身高与年龄范围的车型。
- **Strider 12 Comp** 同样是 12 英寸车，整车 4.9 磅，尼龙复合车架，车把固定。原文没有给出它的骑手身高区间，因此不能替它标注年龄。
- **Micro Balance Bike Ultra LED Neochrome** 公布的是约 3.2 公斤的镁合金车架与低横梁设计。对体型较小的孩子来说，值得看的是低横梁，而不是发光轮圈。
- **woom EXPLORE e** 是面向 7 至 14 岁的电助力脚踏车，不是平衡车，不该按幼儿适配标准来比较。

搜索里强调"骑行稳定"的说法，指向的其实是同样几个问题：轮径、跨步高度和整车重量。上面几款里，除 Strider 未公布骑手身高外，这三项本文都能核对。

## 车架材质的变化顺序

这几次发布对应三种车架材质，各自公布的重量不同：

1. 钢架——12 Sport，12 Comp 就定位在它之下。
2. 铝架——12 Pro，以及 3 公斤的 woom GO 1。
3. 尼龙复合——4.9 磅的 12 Comp，原文称其为 Strider 迄今最轻的 12 英寸车。
4. 镁合金——约 3.2 公斤的 Micro。

这些都是厂商公布值，并非在同一条件下量得的数据：车架几何也不相同。所以这个顺序只是各品牌的选择描述，不是性能排名。

## 本文没有回答的问题

上述发布说明都没有给出 12 Comp 的刹车表现、头管角度或最小腿长。限量配色不改变 woom GO 1 的规格，但库存随季节轮换，能否买到要看当季。适配尺寸这些公告没写的项目，请查看文末链接的平衡车按年龄选指南。`,
  },

  "balance-bike-research": {
    sentinel: "The two studies, side by side",
    en: `
## The two studies, side by side

Both papers come from the same Portuguese research group, and they answer different questions. Keeping them separate is the only honest way to read the numbers:

- The 2022 paper is a parent survey: 2,005 responses collected in Portugal between November 2019 and June 2020. It reports the age at which children first cycled independently — 4.16 years for balance-bike starters, 5.97 for training-wheel starters and 7.27 for those who began on a pedal bike.
- The 2025 paper is a six-session intervention with 50 children who could not yet cycle. It reports success on a conventional bicycle afterward: 100% in the balance-bike group and about 77% in the training-wheels group, with the balance-bike group reaching self-launch, riding and braking faster.

A survey of self-reported history and a small intervention are not the same evidence. The first is broad but depends on families' recall and on which tool the family chose; the second observes practice directly but in one region with 50 children, and reviewers questioned the groups' starting equivalence.

## Reading the age numbers without overstating them

Parents searching for a balance bike for a 2 year old, or asking whether one suits a 3 year old, often want an age promise. The studies do not give one. Their outcome is the age at which independent cycling happened, not the age at which a balance bike should be introduced. The 2022 average of just over four years is a group average with a wide spread, and the 2025 sample was selected for children who could not yet cycle.

What the evidence does support is narrower and more useful: a balance bike used as a first bike tends to precede independent cycling earlier than training wheels. Fit — the inseam-to-seat measurement covered in our balance bike by age guide — remains a separate, practical question that neither study tested.

## Where the evidence stops

The two papers say nothing about long-term safety, crash rates, enjoyment or how many practice hours are needed. They do not compare brands or frame materials, and neither follows children beyond the learning period. Claims about developmental or athletic advantages are not in these papers. If a product page cites research-backed without naming a study, it is leaning on a much thinner literature than that phrase suggests.`,
    zh: `
## 两项研究，放在一起怎么读

两篇论文出自同一支葡萄牙研究团队，回答的却是不同问题。分开读，是唯一诚实的读法：

- 2022 年的研究是家长问卷：2019 年 11 月至 2020 年 6 月在葡萄牙收集了 2005 份回复，报告的是孩子首次独立骑车的年龄——从平衡车起步平均 4.16 岁，从训练轮起步 5.97 岁，直接上脚踏车 7.27 岁。
- 2025 年的研究是六个课时的干预实验，对象为 50 名还不会骑车的孩子，报告的是之后在普通自行车上的成功率：平衡车组 100%，训练轮组约 77%，且平衡车组在自主起步、骑行和刹车三个节点上都更快。

自报历史的问卷与小样本干预实验，不是同一种证据。前者样本广，但依赖家庭回忆，也取决于家庭当初选了哪种车；后者直接观察练习过程，却只来自一个地区的 50 名孩子，评审人还质疑过两组起点的等价性。

## 年龄数字该怎么看

搜索两岁平衡车、或想知道三岁是否适合的孩子家长，往往期待一个年龄承诺。这两项研究都没有给出。它们的结果指标是何时学会独立骑行，不是应该几岁开始骑平衡车。2022 年刚过四岁的均值是群体平均值，个体差异很大；2025 年的样本本身就是按还不会骑车筛选的。

证据能支持的结论更窄，也更有用：平衡车作为孩子的第一辆车，往往比训练轮更早通向独立骑行。而适配——我们《平衡车按年龄选》指南里讲的腿长与座高关系——是另一个实际问题，两项研究都没有测量。

## 证据到哪里为止

这两篇论文没有涉及长期安全、摔车率、骑行乐趣，也没有回答需要练习多少小时。它们不比较品牌或车架材质，也没有在学习期之后继续追踪孩子。所谓发育优势或运动能力收益，并不在这些论文里。如果某个商品页只写有研究背书却不点名具体研究，它依托的文献比这句话暗示的要薄得多。`,
  },

  "strider-bikes-kellys-juvenile-models": {
    sentinel: "How to read this announcement",
    en: `
## How to read this announcement

Three details are worth separating from the rest of the release. First, the 18-inch option exists only on the NAGA Air Belt; the other two models start at 20 inches. Second, the 7-speed drivetrain is stated only for the NAGA Air 50. Third, the "Disc" in NAGA Air 70 Disc is part of the model name — the announcement does not publish a brake specification for any of the three.

That leaves a real gap for a parent comparing a first bike: no weight, no price and no rider-height range were released. An 18-inch wheel is a published size, not a fit guarantee. The practical next step is to measure the child's inseam and compare it with the seat range the retailer publishes at the point of sale, rather than choosing by wheel size alone.

## What "exclusive retailer" changes

Strider's statement that it is the exclusive authorized retailer in the United States, and a spokesperson's comment that it will not wholesale the models, describes where these bikes can be bought. It says nothing about service, spare parts or how long that arrangement lasts. Those questions were not answered in the announcement and are not answered here.`,
    zh: `
## 怎么读这份公告

公告里有三点值得单独拎出来。第一，18 英寸只出现在 NAGA Air Belt 上，另外两款都从 20 英寸起。第二，7 速变速只明确写在 NAGA Air 50 上。第三，NAGA Air 70 Disc 里的碟刹字样只是型号名的一部分——公告没有公布任何一款的刹车规格。

对正在给孩子挑第一辆车的人来说，这里有个真实的空白：重量、价格和骑手身高区间都没有公布。18 英寸是一个已公布的轮径，不等于适配保证。更实用的做法是先量孩子的腿长，再对照零售商在销售页面给出的座高范围，而不是只按轮径选车。

## 独家零售意味着什么

Strider 称自己是美国独家授权零售商，发言人也表示不会做批发——这些说明的是在哪里能买到，并没有回答售后、零配件供应或这个安排会持续多久。公告没有回答这些问题，本文也不替它回答。`,
  },

  "choosing-and-using-child-safety-seats": {
    sentinel: "Putting the three groups in order",
    en: `
## Putting the three groups in order

The article's stage sequence is defined by the seat's limits, not by the child's birthday:

1. A rear-facing infant seat from newborn to about 15 months.
2. A convertible seat for toddlers to 4 years and older, with rear-facing kept as long as the seat allows.
3. A high-back booster from 4 to 12, once the child is tall enough for the belt to cross the shoulder and pelvis.

The overlap is deliberate. "4 years and older" and "ages 4 to 12" are ranges from the source, and a child does not move groups on a date. The transition rule in the article is the seat's limit and the height requirement, not age alone.

## What the fitting rule is really saying

The 2–3 cm movement figure is a check, not a product feature: hold the seat at its belt path and try to move it side to side. If it moves more than the stated amount, tighten it. ISOFIX or the seatbelt are the two fixing methods named in the article; it does not compare them or claim one is safer.

The two mistakes named earlier have the same root — the child is not actually secured by the restraint. An adult's arms are not a restraint in a crash, and a loose harness leaves the child able to move out of position. Neither is solved by buying a more expensive seat.`,
    zh: `
## 三个阶段的正确顺序

原文的阶段顺序由座椅限值决定，而不是由孩子的生日决定：

1. 反向安装的婴儿提篮，从新生儿到约 15 个月。
2. 成长型座椅，覆盖幼儿到 4 岁或更大；只要座椅允许，就继续保持反向乘坐。
3. 增高垫配合安全带，4 至 12 岁，前提是身高已让安全带能正确跨过肩膀与骨盆。

阶段之间有重叠，这是原文的口径。4 岁或更大和 4 至 12 岁都是范围，孩子不会因为到了某一天就自动换组。文中给出的换组依据是座椅限值与身高要求，而不是年龄本身。

## 安装规则到底在说什么

2–3 厘米的晃动是一个检查动作，不是产品卖点：握住安全带路径处左右晃动座椅，超过这个幅度就重新紧固。原文点名的固定方式只有接口或安全带两种，并没有比较二者，也没有声称哪一种更安全。

前面提到的两个误区有同一个根源：孩子并没有真正被约束装置固定住。事故发生时，家长的手臂不是约束装置；安全带过松，孩子仍可能移位。这两件事都不是换更贵的座椅就能解决的。`,
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
