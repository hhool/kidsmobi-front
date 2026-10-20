/**
 * Write the 3 CMS guide articles that take the reference-cluster block to
 * 8/8 CMS-backed cards: by-age, what-buyers-say and stability.
 *
 * These three topics already exist as Plan-B reference assets
 * (/balance-bike-by-age/ etc.). The articles are deliberately positioned as
 * buying-decision guides that link into the data-reference assets — different
 * intent, no cannibalization. Every figure is read out of the same generated
 * datasets the asset pages render from (src/data/*.generated.ts), so an article
 * and its asset page can never quote different numbers.
 *
 * Usage:
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/write-3-guides.mjs --dry-run
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/write-3-guides.mjs --apply
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
    id: "guide-2026-by-age",
    slug: "balance-bike-by-age",
    category: "beginner",
    taxonomy: { productCategory: "balance", hub: "all_guides", topicCategory: "beginner", topicOrder: 4 },
    seo: {
      en: {
        title: "Balance Bike by Age: What Fits Each Year",
        description:
          "Balance bike age ranges disagree by years for the same child. What a manufacturer's own age span means, where coverage thins, and how to check the fit.",
        keywords: ["balance bike by age", "balance bike for 2 year old", "balance bike age range", "balance bike for 3 year old"],
      },
      zh: {
        title: "平衡车按年龄选：1 岁、2 岁、3 岁怎么挑",
        description:
          "同一个孩子，不同平衡车标的年龄能差好几岁。厂商年龄区间到底说了什么、哪个年龄段可选车型骤减，以及怎么把一个生日变成可核对的适配判断。",
        keywords: ["平衡车年龄", "2岁平衡车", "平衡车年龄段", "3岁平衡车"],
      },
    },
    en: {
      title: "Balance Bike by Age: What Fits Each Year",
      content: `Balance bike listings are sorted by age, but the age on the box is the manufacturer's opinion, not a measurement. This guide covers what the age ranges in this category actually say, where the coverage thins out, and how to turn a birthday into a fit check you can do before you buy.

## Why age ranges disagree

Two listings can both say "for 2 year olds" and still fit the same child differently, because the age range is written by the brand from its own seat-height range, while the child is measured in inseam. Age is the label the market searches on; the seat range is what decides the fit. When a listing publishes both, check that the seat range is consistent with its own age span. When it publishes only the age, you are reading a claim with nothing behind it.

## What the snapshot says

The figures below are read out of this site's own product specification snapshot — 156 products scanned on 13 October 2026 — and they are the same figures the [age-fit reference](/balance-bike-by-age/) renders.

- 13 balance bikes are listed in the snapshot.
- 12 of the 13 publish an age range; one publishes none.
- The stated spans run from 10 months to 60 months — a five-year spread across a category most children use for two.
- The published spans cluster hard at the young end: 6 of the 12 say 12–24 months, 3 say 24–60, 2 say 10–36, and 1 says 18–60.

So the category is not one continuous ladder. It is two shelves: a starter shelf that ends at the second birthday, and a second shelf aimed at two-to-five-year-olds.

## Coverage by age

Counting how many of those 12 listings still cover the child at each age:

- 1 year — 8 of 12.
- 18 months — 9 of 12.
- 2 years — 12 of 12.
- 2.5 years — 6 of 12.
- 3 years — 6 of 12.
- 3.5 years — 4 of 12.
- 4 years — 4 of 12.
- 5 years — 4 of 12.

Two years old is the best-served age in the category, and the only one every listing covers. After it the pool halves twice: six listings still fit at three, and four at four. If you are shopping for a four-year-old you are choosing among four models, and by then it is worth asking whether a balance bike is the right purchase at all.

## The four-wheel cluster

The youngest end of the category looks different from the rest. Of the 13 balance bikes in the snapshot, five are four-wheel models, and every one of them carries a 12–24 month age span — they are the entire young end of the market. A four-wheel layout stands up on its own, which is what the youngest riders need; what it removes is the lean, so the balancing practice happens later. That is a stage, not a defect.

## Turning a birthday into a fit number

Age gets you to a shortlist; the inseam gets you to a bike.

1. **Use the age to pick the shelf.** Under two, the 12–24 month cluster; over two, the 24–60 month cluster.
2. **Measure the inseam and read the seat-height range, not the age.** The [size chart guide](/guides/beginner/balance-bike-size-chart) walks through the two-minute measurement.
3. **Check the top of the seat range, not the bottom.** A bike that fits today but tops out at this year's inseam is a one-year purchase.
4. **Treat a missing age range as a missing answer, not a neutral one.** A listing that will not state its span rarely publishes a seat range either.

## Age and the rest of the decision

- **At one:** the starter cluster. Look for the lowest seat position available and accept a short useful life — a 12-month-old grows out of a first bike quickly. The [1-year-old guide](/guides/beginner/best-balance-bike-for-1-year-old) covers this age specifically.
- **At two:** the best-served age, and the point where a wide seat range starts to pay. This is the age to buy for the next two years rather than the next six months.
- **At three and beyond:** the pool narrows to six, then four, and many children are ready for a pedal bike by then.
- **Weight matters more with age.** A three-year-old can lift more bike than an 18-month-old can; the [weight guide](/guides/beginner/balance-bike-weight) covers what the materials change.

## Method and limits

Every age figure here is quoted from the manufacturer's own listing copy — the age field each retailer syncs — and captured in the 13 October 2026 snapshot of 156 products. No age span is measured, averaged, or inferred by us, and where a listing states no age range this page reports none. Spans change when brands revise their copy, so verify against the current listing before buying.

## Further reading

- [Balance bike by age reference](/balance-bike-by-age/) — every listing, by age band.
- [Size chart guide](/guides/beginner/balance-bike-size-chart) — inseam to seat height.
- [Stability guide](/guides/scenario/balance-bike-stability) — what the youngest cluster gives up for standing up on its own.`,
    },
    zh: {
      title: "平衡车按年龄选：1 岁、2 岁、3 岁怎么挑",
      content: `平衡车列表都是按年龄排的，但箱子上的年龄是厂商的说法，不是测量结果。这篇讲清楚：这个品类的年龄区间到底说了什么、哪个年龄段可选车型骤减，以及怎么把一个生日变成买之前就能核对的适配判断。

## 为什么年龄区间会互相矛盾

两辆车都写"适合 2 岁"，装到同一个孩子身上可能完全不同——因为年龄区间是品牌按自己的座高范围写的，而孩子要用腿内长来量。年龄是市场上被搜索的标签，座高范围才决定合不合身。车型两个都写时，核对一下座高范围和它自己的年龄区间是否自洽；只写年龄的，你读到的是一个背后没有任何数据的说法。

## 快照里的数据

下面的数字来自本站自己的产品规格快照（2026 年 10 月 13 日抓取 156 个商品），也是[按年龄参考页](/balance-bike-by-age/)渲染的同一批数字。

- 快照里有 13 辆平衡车。
- 其中 12 辆标了年龄区间，1 辆没标。
- 标出的区间从 10 个月跨到 60 个月——一个大多数孩子只用两年的品类，年龄跨度却有五年。
- 区间高度集中在低龄端：12 辆里 6 辆写 12–24 个月，3 辆写 24–60 个月，2 辆写 10–36 个月，1 辆写 18–60 个月。

所以这个品类不是一条连续的梯子，而是两层货架：一层到两岁为止的入门货架，一层面向 2–5 岁的第二层货架。

## 各年龄段的覆盖

数一下这 12 辆里，每个年龄还有几辆仍在区间内：

- 1 岁——12 辆里有 8 辆。
- 18 个月——9 辆。
- 2 岁——12 辆全部。
- 2.5 岁——6 辆。
- 3 岁——6 辆。
- 3.5 岁——4 辆。
- 4 岁——4 辆。
- 5 岁——4 辆。

两岁是这个品类服务得最好的年龄，也是唯一一个所有车型都覆盖的年龄。之后可选池连砍两次：三岁还剩 6 辆，四岁只剩 4 辆。给四岁孩子挑车，你是在 4 个型号里做选择——到这个岁数，也该先问一句平衡车是不是还该买。

## 四轮那一簇

低龄端和其余部分长得不一样。快照里 13 辆平衡车中有 5 辆是四轮的，而这 5 辆全部标着 12–24 个月的年龄区间，它们几乎就是低龄市场的全部。四轮布局能自己立住，这正是最小 rider 需要的；它换掉的是"倾斜"——四轮车不需要被平衡，平衡练习因此推后。这是一个阶段，不是缺点。

## 把一个生日变成一个适配数字

年龄把你带到候选清单，腿内长把你带到具体的车。

1. **用年龄选货架。** 两岁以下看 12–24 个月那一簇，两岁以上看 24–60 个月那一簇。
2. **量腿内长，读座高范围，而不是读年龄。** 两分钟测量方法见[尺寸指南](/guides/beginner/balance-bike-size-chart)。
3. **看座高范围的上限，不是下限。** 今天合身但上限就卡在今年腿内长的车，只能用一年。
4. **没标年龄区间，等于没回答，而不是中性。** 不肯标区间的车型，也很少会标座高范围。

## 年龄与其余决策

- **一岁：** 入门簇。找能找到的最低座高，并接受较短的使用期——12 个月大的孩子长得很快。[一岁专篇](/guides/beginner/best-balance-bike-for-1-year-old)讲的就是这个年龄。
- **两岁：** 服务得最好的年龄，也是宽座高开始回本的地方。这个岁数应该为接下来两年买，而不是为接下来半年买。
- **三岁及以上：** 可选池收窄到 6 辆、再收窄到 4 辆，而很多孩子这时已经可以上脚踏车了。
- **年龄越大，重量越重要。** 三岁孩子能扶起的车，比 18 个月孩子能扶起的更重；材料改变了什么见[重量指南](/guides/beginner/balance-bike-weight)。

## 方法与边界

这里每个年龄数字都引自厂商自己的列表文案（各零售商同步的那个年龄字段），取自 2026 年 10 月 13 日、156 个商品的快照。没有一个年龄区间是我们测量、平均或推断出来的；车型没标的，本页就报"未标注"。品牌改文案时区间也会变，下单前请对着当时的列表核一遍。

## 延伸阅读

- [按年龄参考页](/balance-bike-by-age/)——按年龄段列出每一辆。
- [尺寸指南](/guides/beginner/balance-bike-size-chart)——从腿内长到座高。
- [稳定性指南](/guides/scenario/balance-bike-stability)——低龄簇为能自己立住付出了什么。`,
    },
  },
  {
    id: "guide-2026-buyers-say",
    slug: "balance-bike-what-buyers-say",
    category: "beginner",
    taxonomy: { productCategory: "balance", hub: "all_guides", topicCategory: "beginner", topicOrder: 5 },
    seo: {
      en: {
        title: "What Buyers Say About Balance Bikes",
        description:
          "No verbatim reviews here: what the 14 retailer-generated buyer summaries behind balance bike listings mention, and how to read one.",
        keywords: ["balance bike reviews", "what buyers say balance bike", "balance bike customer reviews", "balance bike feedback"],
      },
      zh: {
        title: "买家评价怎么读：平衡车的评价文本说了什么",
        description:
          "本站没有逐条用户评价。平衡车列表背后那 14 条零售商生成的买家情绪摘要提到了什么，以及怎么读才不会过度相信它。",
        keywords: ["平衡车评价", "平衡车买家评价", "平衡车用户反馈", "平衡车评论"],
      },
    },
    en: {
      title: "What Buyers Say About Balance Bikes",
      content: `This site does not publish star ratings, and it does not hold verbatim customer reviews. What it does hold is one retailer-generated buyer-sentiment summary per listing — a few sentences of prose per product — and this guide is about reading those honestly.

## What a buyer-sentiment summary is

A summary of this kind is produced by a retailer's system from its own review corpus: "Customers find this balance bike easy to assemble and sturdy." It is not a review. It is a paraphrase of reviews, and it carries no rating, no sample size, and no date. In this snapshot the median summary for a balance bike is 391 characters — about sixty words — which is a paragraph, not evidence.

What the snapshot contains:

- 174 products are published, and 164 of them carry a summary; 159 of those 164 are distinct, so five listings share their text with another.
- 14 balance bike listings are published, and all 14 carry a summary — every one distinct, none reused.
- For this category the summaries are the whole population, not a sample of it.

## What they mention

Counting mentions across the 14 balance bike summaries:

- Assembly — 14 of 14.
- Build quality — 11 of 14.
- Learning to ride — 11 of 14.
- Age fit — 8 of 14.
- Stability — 5 of 14.
- Weight — 5 of 14.
- Lights, sound and extras — 3 of 14.
- Wheel noise — 1 of 14.

Assembly is mentioned in every single one, which tells you less about balance bikes than about what these summaries are for: they exist to reassure a buyer who has not opened the box yet. The two themes that should interest a buyer more — stability and weight — appear in only five of fourteen each.

## The three hedges

The same corpus, counted the other way round — how much of it is not unqualified praise:

- 12 of 14 attribute at least one statement to one buyer, using phrasing like "one customer" or "some customers", rather than to the corpus.
- 6 of 14 contain mixed or split wording, of the "however" or "while some… others" kind.
- 5 of 14 name an explicit drawback in so many words.

A sentence that opens with "Customers find this bike easy to assemble" and continues "however, some mention the seat post slips" is doing two jobs at once, and only the second one is useful to you.

## How to read one in sixty seconds

1. **Find the drawback clause.** Most summaries have one. If you cannot find it, the summary is less informative, not the product better.
2. **Discount every sentence that names a single buyer.** One customer's experience is one data point.
3. **Keep the concrete and drop the adjectives.** "Arrived with two bolts missing" is actionable; "great quality" is not.
4. **Check whether the summary mentions the thing you care about at all.** If you are buying for a small two-year-old and the text never mentions age fit, it is not evidence either way.
5. **Then stop reading.** A 391-character summary cannot substitute for a seat height.

## What summaries cannot tell you

- **They are not a rating.** There is no average behind them, and a summary that sounds enthusiastic can sit on a product with the same reception as one that sounds measured.
- **They say nothing about fit.** No summary in this corpus carries a seat height, and none mentions an inseam. Fit is a measurement question — see the [size chart guide](/guides/beginner/balance-bike-size-chart).
- **They are not a safety check.** Anything that could put a child at risk shows up in the recall databases first, and usually not in retail review text at all. Check [CPSC recalls](https://www.cpsc.gov/Recalls) and the [EU Safety Gate](https://ec.europa.eu/safety-gate) instead.
- **They age.** The corpus behind a summary is only as current as the listing.

## Method

Every figure here is counted from the 14 retailer-generated sentiment summaries attached to the balance bike listings in this site's product snapshot, generated 13 October 2026. Themes and hedges are counted by phrase, so a mention is a mention of the topic rather than a rating of it, and the same summary can count toward several themes. No summary is treated as a first-hand review, and none of this substitutes for the manufacturer's own specification.

## Further reading

- [What buyers say reference](/balance-bike-what-buyers-say/) — the aggregate per theme, with the source stated at the top.
- [Recalls guide](/guides/risk/balance-bike-recalls) — the two-minute check that matters more.
- [Balance bike by age](/guides/beginner/balance-bike-by-age) — where the category's coverage actually thins out.`,
    },
    zh: {
      title: "买家评价怎么读：平衡车的评价文本说了什么",
      content: `本站不发星级评分，也没有逐条的用户评价。它有的是每个车型一条零售商生成的"买家情绪摘要"——每件商品几句话的短文。这篇讲的就是怎么诚实地读它。

## 买家情绪摘要是什么

这类摘要由零售商的系统从自己的评价语料里生成，例如"顾客觉得这辆平衡车好装、结实"。它不是评价，而是对评价的转述，不带评分、不带样本量、也不带日期。在本快照里，平衡车摘要的中位长度是 391 个字符，约六十个词——那是一段话，不是证据。

快照里有什么：

- 已发布商品 174 件，其中 164 件带摘要；这 164 条里有 159 条互不相同，也就是说有 5 件与其他商品共用文本。
- 已发布平衡车 14 辆，14 辆都带摘要，且全部互不相同、没有复用。
- 对这个品类来说，这些摘要就是全体，而不是抽样。

## 它们提到了什么

在 14 条平衡车摘要里逐项计数：

- 组装——14 条里的 14 条。
- 做工——11 条。
- 学会骑车——11 条。
- 年龄适配——8 条。
- 稳定性——5 条。
- 重量——5 条。
- 灯光、声音与附加件——3 条。
- 轮子噪音——1 条。

每一条都提到组装，这件事说明的更多是摘要的用途，而不是平衡车本身：它们是用来安抚还没拆箱的买家的。买家更该关心的两项——稳定性和重量——各自只在 14 条里出现 5 次。

## 三个保留项

同一批语料，换个方向数——有多少不是无保留的夸奖：

- 14 条里有 12 条至少有一句话说了"一位顾客"或"一些顾客"，把它归属于单个买家，而不是整个语料。
- 14 条里有 6 条出现混合或分歧的措辞，即"然而""虽然有些人……另一些人"这类。
- 14 条里有 5 条直接点名了缺点。

一句以"顾客觉得这车好装"开头、接着说"然而有人提到座管会滑"的话，同时在做两件事，而只有第二件对你有用。

## 六十秒读完一条

1. **先找缺点从句。** 大多数摘要都有一个。找不到，说明这条摘要信息量更少，不是产品更好。
2. **凡是点名单个买家的句子都打折。** 一位顾客的经历只是一个数据点。
3. **留具体的，扔形容词。** "到货少两个螺栓"可以行动，"质量很好"不行。
4. **看你关心的事有没有被提到。** 如果你是为个头偏小的两岁孩子买车，而文本始终没提年龄适配，那它在这一项上两边都算不上证据。
5. **然后就别读了。** 391 个字符的摘要替代不了一个座高数字。

## 摘要告诉不了你的事

- **它们不是评分。** 背后没有平均值；听起来热情的摘要和听起来克制的摘要，可能落在两款口碑相同的产品上。
- **它们对合身性什么都没说。** 这批语料里没有一条摘要带座高数字，也没有一条提到腿内长。合身是测量问题——见[尺寸指南](/guides/beginner/balance-bike-size-chart)。
- **它们不是安全检查。** 任何可能让孩子受伤的问题，会先出现在召回数据库里，而且通常根本不会出现在零售评价文本里。该查的是 [CPSC 召回](https://www.cpsc.gov/Recalls)和 [EU Safety Gate](https://ec.europa.eu/safety-gate)。
- **它们会过期。** 摘要背后的语料只和当前列表一样新。

## 方法

这里每个数字都数自本站商品快照（生成于 2026 年 10 月 13 日）中挂在平衡车车型上的 14 条零售商生成情绪摘要。主题与保留项按词组计数，所以一次提及代表提到该话题，而不是对它打分，同一条摘要可以计入多个主题。没有任何一条被当作第一手评价，这些也都不替代厂商自己的规格。

## 延伸阅读

- [买家评价参考页](/balance-bike-what-buyers-say/)——按主题汇总，顶部写明来源。
- [召回指南](/guides/risk/balance-bike-recalls)——更值得花的那两分钟。
- [按年龄选车](/guides/beginner/balance-bike-by-age)——品类覆盖真正变薄的地方。`,
    },
  },
  {
    id: "guide-2026-stability",
    slug: "balance-bike-stability",
    category: "scenario",
    taxonomy: { productCategory: "balance", hub: "all_guides", topicCategory: "scenario", topicOrder: 3 },
    seo: {
      en: {
        title: "Stable Track Balance Bikes: What Holds",
        description:
          "Twelve of thirteen balance bike listings claim stability; one publishes a number. What a stable track means, and what to check in person.",
        keywords: ["stable track balance bike", "balance bike stability", "balance bike four wheels", "balance bike tire width", "balance bike steering limit"],
      },
      zh: {
        title: "平衡车的稳定性：靠什么站得住",
        description:
          "13 辆平衡车里有 12 辆宣称稳定，只有 1 辆给出数字。什么叫稳定的轨迹、四轮改变了什么、以及到手该查哪几项。",
        keywords: ["平衡车稳定性", "四轮平衡车", "平衡车轮距", "平衡车轮胎宽度"],
      },
    },
    en: {
      title: "Stable Track Balance Bikes: What Holds",
      content: `"Stable track" is the phrase this category sells itself on and the one it documents least. This guide covers what stability means on a balance bike, which of it is measurable, and why the honest answer to "which balance bike is most stable" is a geometry lesson rather than a product list.

## The measurement gap

From this site's product specification snapshot — 156 products scanned on 13 October 2026, 13 of them balance bikes — this is how many listings state each spec:

- Frame material — 13 of 13.
- Stability language somewhere in the copy — 12 of 13.
- Wheel size — 7 of 13.
- Wheel count — 5 of 13.
- Maximum load — 4 of 13.
- Track spacing — 1 of 13.
- Tire width — 1 of 13.
- Steering limit — 1 of 13.
- Tire class, foam or pneumatic — 0 of 13.

Twelve of thirteen listings use the word "stable" or something like it. One publishes a number you could compare against another bike. That gap is the most useful fact about stability in this category, and it is also why a ranking of these models by stability cannot be defended.

## The one listing that publishes geometry

One model states a front and rear wheel spacing of 5.1 inches (13 cm), a tire width of 1.45 inches (3.7 cm), a steering limit of 45 degrees, a maximum load of 66 lb, 7-inch wheels and a high-carbon steel frame. It is also a four-wheel model.

That is the entire published geometry of the balance bike category in this snapshot: one model, and it is a four-wheel one — the configuration where those numbers matter least.

## What actually holds a balance bike up

Four things, in the order they matter:

1. **Seat height, not geometry.** A child who can put both feet flat on the ground can stop themselves; a child on tiptoe cannot. This is the same inseam-to-seat-height check as the [size chart guide](/guides/beginner/balance-bike-size-chart), and it does more for real-world stability than any frame dimension.
2. **Track width** — the distance between the two wheels' contact points. Wider is steadier at rest, and it is the number almost nobody publishes.
3. **A steering limiter.** A handlebar that can rotate far enough will jackknife under a child who leans on it. One listing in thirteen states a limit, at 45 degrees; the rest either do not have one or do not say.
4. **Tire width and material.** Wider tires grip more, and pneumatic tires absorb what foam ones transmit. Zero of thirteen listings state a tire class, which makes this the easiest thing to check with your own eyes and the hardest to check from a listing.

## Two wheels or four

Five of the 13 balance bikes in the snapshot are four-wheel models, and every one of them sits in the 12–24 month age band. A four-wheel layout stands up on its own: the child can sit, walk and stop without anyone holding the bike, and there is no falling sideways at a standstill. What it removes is the lean — a four-wheel bike does not have to be balanced, so that practice happens later.

That is a sequence, not a defect. The four-wheel models are also the lowest and lightest in the snapshot, and for the youngest riders that is the right trade. If you are buying for a child who already walks confidently, a two-wheeler with a low seat is the shorter path; [balance bike by age](/guides/beginner/balance-bike-by-age) shows where the two clusters sit.

## What the standard now requires

EN 71-1:2026 — the mechanical and physical half of the EU toy standard — gathered ride-on toys into a single clause and added requirements specific to them: clearance dimensions, a minimum front wheel diameter, handlebar dimensions, minimum insertion-depth marks, clamping, and stability and strength tests. From 2026 into 2027 the market is in a transition window, with national adoption due by 31 July 2026, withdrawal of conflicting national standards by 31 July 2027, and European Commission harmonisation expected roughly a year after publication. A bike certified to the previous edition has not been put through the balance-bike-specific tests. The [safety standards guide](/guides/risk/balance-bike-safety-standards) covers the four rules that can apply and how to verify them.

## What to check in person

1. **Push the bike sideways with a hand on the saddle.** Any play in the joint between seat post and frame shows up here.
2. **Turn the bars to their stop and watch the front wheel.** If they rotate far past 45 degrees, there is no limiter.
3. **Sit the child on it and look at the feet.** Flat on the ground is the pass condition; tiptoe is not.
4. **Lift it.** A child who cannot lift the bike cannot recover it; the [weight guide](/guides/beginner/balance-bike-weight) covers what the materials change.
5. **Read the tires.** Foam or air, and how wide — the one spec no listing states and every shop shows.

## Method and limits

Every figure is read out of listing copy in the site's CMS product snapshot of 13 October 2026, the same source the [stability reference](/balance-bike-stability/) renders. Nothing here is measured by us; a spec the listing does not state is reported as not stated, and a value like "ultra lightweight" in a frame field is treated as a missing material rather than a real one. Because so few listings publish geometry, this page ranks nothing and instead tells you what to put your hands on.

## Further reading

- [Stability and track width reference](/balance-bike-stability/)
- [Size chart guide](/guides/beginner/balance-bike-size-chart)
- [Weight and materials](/guides/beginner/balance-bike-weight)
- [Safety standards](/guides/risk/balance-bike-safety-standards)`,
    },
    zh: {
      title: "平衡车的稳定性：靠什么站得住",
      content: `"稳定的轨迹"是这个品类最爱讲、却最少拿证据的一句话。这篇讲平衡车的稳定性到底是什么、其中哪些可测量，以及为什么"哪辆平衡车最稳"这个问题，诚实的答案是几何课，而不是一张榜单。

## 测量的空白

下面是本站产品规格快照（2026 年 10 月 13 日抓取 156 个商品，其中 13 辆平衡车）中，各规格被标出的车型数：

- 车架材料——13 辆里的 13 辆。
- 文案里出现"稳定"之类说法——12 辆。
- 轮径——7 辆。
- 轮数——5 辆。
- 最大承重——4 辆。
- 轮距——1 辆。
- 轮胎宽度——1 辆。
- 转向限位——1 辆。
- 轮胎类别（发泡或充气）——0 辆。

13 辆里有 12 辆用了"稳定"或类似的说法。给出可比较数字的只有 1 辆。这个落差，是这个品类关于稳定性最有用的一个事实，也正是为什么按稳定性给这些车型排名站不住脚。

## 唯一标出几何的那辆

有一辆标了前后轮间距 5.1 英寸（13 厘米）、轮胎宽度 1.45 英寸（3.7 厘米）、转向限位 45 度、最大承重 66 磅、7 英寸轮径和高碳钢车架。它同时是一辆四轮车。

这就是这份快照里平衡车品类公布的全部几何数据：一辆车，而且还是四轮的——恰恰是这些数字最不重要的那种结构。

## 真正让平衡车站得住的四件事

按重要程度排序：

1. **座高，不是几何。** 能双脚平放在地上的孩子能自己停下来，踮着脚的孩子不能。这和[尺寸指南](/guides/beginner/balance-bike-size-chart)里从腿内长到座高的检查是同一件事，它对真实稳定性的贡献，比任何一个车架尺寸都大。
2. **轮距**——两个轮子着地点之间的距离。越宽静止时越稳，而这是几乎没人公布的数字。
3. **转向限位器。** 车把能转到足够大角度时，会在孩子压上去的瞬间折死。13 辆里有 1 辆标了限位，是 45 度；其余要么没有，要么不说。
4. **轮胎宽度与材质。** 胎越宽抓地越多，充气胎吸收掉发泡胎会直接传导的东西。13 辆里 0 辆标明轮胎类别，这让它成为最易用眼睛确认、又最难从列表确认的一项。

## 两轮还是四轮

快照里 13 辆平衡车中有 5 辆是四轮的，而且全部落在 12–24 个月这个年龄区间。四轮布局能自己立住：孩子可以坐上去、走、停，不需要人扶着车，静止时也不会侧翻。它换掉的是"倾斜"——四轮车不需要被平衡，所以这项练习会推后。

这是一个顺序，不是缺陷。四轮车型同时也是快照里座高最低、重量最轻的那一批，对最小的孩子来说这个交换是对的。如果你是为已经走得稳的孩子挑车，一辆座高够低的两轮车是更短的路；两个簇各自的位置见[按年龄选车](/guides/beginner/balance-bike-by-age)。

## 标准现在要求什么

EN 71-1:2026——欧盟玩具标准里机械与物理的那一半——把乘骑玩具并入单一条款，并新增了针对它们的要求：间隙尺寸、最小前轮径、车把尺寸、最小插入深度标记、夹紧，以及稳定性与强度测试。2026 到 2027 年市场处在过渡窗口：各国最晚 2026 年 7 月 31 日采纳，冲突国标最晚 2027 年 7 月 31 日废止，欧盟委员会的协调批准预计在发布约一年后到来。按旧版认证的车，没有经过那批平衡车专项测试。可能适用的四条规则及其核查方法见[安全标准指南](/guides/risk/balance-bike-safety-standards)。

## 到手该查的五件事

1. **一只手按在座上，把车往侧面推。** 座管与车架连接处的任何旷量都会在这里露出来。
2. **把车把转到尽头，盯着前轮。** 如果能转过 45 度很多，就是没有限位器。
3. **让孩子坐上去，看脚。** 双脚平放算通过，踮脚不算。
4. **拎一下。** 孩子提不动的车，他也扶不回来；材料改变了什么见[重量指南](/guides/beginner/balance-bike-weight)。
5. **读轮胎。** 发泡还是充气、胎面多宽——这是列表不标、店里一眼可见的一项。

## 方法与边界

这里每个数字都读自本站 CMS 商品快照的列表文案（2026 年 10 月 13 日），与[稳定性参考页](/balance-bike-stability/)渲染的是同一来源。没有任何一项是我们测量的；列表没标的规格，本页就报"未标注"，车架字段里"超轻"这类值被当作材料缺失，而不是真实材料。因为公布几何的车型太少，本页不做任何排名，只告诉你该动手查什么。

## 延伸阅读

- [稳定性与轮距参考页](/balance-bike-stability/)
- [尺寸指南](/guides/beginner/balance-bike-size-chart)
- [重量与材料](/guides/beginner/balance-bike-weight)
- [安全标准](/guides/risk/balance-bike-safety-standards)`,
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

const checkBody = (id, en, zh) => {
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
  checkSeo(g.id, g.seo);
  checkBody(g.id, g.en, g.zh);
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
