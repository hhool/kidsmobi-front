/**
 * B-track, tier C1 (2026-10-22): rewrite the what-buyers-say *guide* so the pair
 * stops competing.
 *
 * This is the one pair of eight where the collision was not a matter of taste.
 * Both pages carried the H1 "What Buyers Say About Balance Bikes" byte for byte,
 * and their subheads lined up too: "What they mention" / "The three hedges" on
 * the guide against "What the summaries mention" / "Where the praise is
 * qualified" on the asset page — the same counts, presented twice.
 *
 * scripts/set-guides-intent-split.ts already fixed the H1 and the TDK, which
 * separates the query. This script finishes the job on the body, which is what
 * C1 actually asked for ("改写为操作视角 … 资产页保留数据视角"):
 *
 *   - the two count-led sections are gone. They restated the asset page's table;
 *     the numbers are not lost, they live on /balance-bike-what-buyers-say/ and
 *     the guide now points there instead of repeating them.
 *   - a new section covers the three cases where a summary carries no signal at
 *     all (no summary, a reused one, an unqualified one). Those figures come
 *     from the whole 174-product catalogue and appear nowhere on the asset page,
 *     which only counts the 14 balance bikes — so this is new ground, not a
 *     re-cut of existing copy.
 *   - "how to read one" and "what summaries cannot tell you" are kept: they are
 *     the guide's actual job and have no counterpart on the asset page.
 *
 * Every figure is taken from src/data/reviewData.generated.ts (174 published,
 * 164 with a summary, 159 distinct, 14/14 balance bikes, median 391 chars,
 * assembly 14, build 11, learning 11, ageFit 8, stability 5, weight 5, extras 3,
 * noise 1; hedges qualified 12, mixed 6, negative 5).
 *
 * Two renderer constraints, both learned the hard way elsewhere in this repo:
 *   - rich text is parsed by one shared classifier, src/lib/richContentBlocks.ts
 *     classifyRichLine(). A numbered line that is short and does not end in
 *     punctuation gets promoted to a heading, so every numbered step ends with a
 *     full stop.
 *   - only `## ` headings are used, which is what the other guides emit.
 *
 * Usage:
 *   CMS_ADMIN_ALL_TOKEN=<token> npx tsx scripts/rewrite-buyers-say-guide.ts --dry-run
 *   CMS_ADMIN_ALL_TOKEN=<token> npx tsx scripts/rewrite-buyers-say-guide.ts --apply
 */

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const API_BASE = (process.env.CMS_API_BASE || "https://store.balancebiketoddler.com").replace(/\/+$/, "");
const TOKEN = String(process.env.CMS_ADMIN_ALL_TOKEN || "").trim();

const ID = "guide-2026-buyers-say";
const SLUG = "balance-bike-what-buyers-say";
const ASSET_URL = "/balance-bike-what-buyers-say/";

const EN = `This site does not publish star ratings, and it does not hold verbatim customer reviews. What it does hold is one retailer-generated buyer-sentiment summary per listing — a few sentences of prose per product — and this guide is about reading those honestly.

## What you are actually reading

A summary of this kind is produced by a retailer's system from its own review corpus: "Customers find this balance bike easy to assemble and sturdy." It is not a review. It is a paraphrase of reviews, and it carries no rating, no sample size, and no date. In this snapshot the median summary for a balance bike is 391 characters — about sixty words — which is a paragraph, not evidence.

Two things follow from that length. A summary too short to enumerate a product's weak points cannot be used as evidence that it has none, and a summary with no measurement in it cannot tell you whether the bike fits your child.

## Why assembly tops the list

Assembly is mentioned in all fourteen balance bike summaries in this snapshot; stability and weight are each mentioned in five. That is not a finding about balance bikes. It is a finding about what these summaries are written for: to reassure someone who has not opened the box yet, and assembly is the worry that comes before the purchase.

So the most frequently mentioned theme is also the least useful one. If you are trying to work out whether a bike suits a small two-year-old, the theme worth hunting for is the one that appears least often — and the [per-theme counts for all fourteen summaries](${ASSET_URL}) stay on the reference page rather than being repeated here.

## The hedges that carry the signal

Most of what is useful in a summary sits in the clauses that qualify the praise. There are three shapes to recognise:

- **Attribution to one buyer.** Phrasing like "one customer" or "some customers" narrows a statement to a single experience. It turns up in twelve of the fourteen summaries here, and it should be read as one data point rather than as a consensus.
- **Split wording.** "However", or "while some… others" — the sentence is telling you the balance of opinion is not settled. Six of the fourteen are written this way.
- **A named drawback.** The rarest of the three, at five of fourteen, and the only part of a summary that gives you something to act on.

A sentence that opens with praise and then continues past a "however" is doing two jobs at once, and only the second one is useful to you.

## How to read one in sixty seconds

1. **Find the drawback clause.** Most summaries have one. If you cannot find it, the summary is less informative, not the product better.
2. **Discount every sentence that names a single buyer.** One customer's experience is one data point.
3. **Keep the concrete and drop the adjectives.** "Arrived with two bolts missing" is actionable; "great quality" is not.
4. **Check whether the summary mentions the thing you care about at all.** If you are buying for a small two-year-old and the text never mentions age fit, it is not evidence either way.
5. **Then stop reading.** A 391-character summary cannot substitute for a seat height.

## When a summary tells you nothing

Three situations look like information and are not:

- **There is no summary.** Ten of the 174 published products in this snapshot carry none. A missing summary is a gap in the catalogue, not a verdict on the bike.
- **The summary is reused.** Five of the 164 published summaries repeat the text attached to another listing, so the words may not have been written about the bike in front of you.
- **The summary is unqualified praise.** With no drawback clause and no attribution, there is nothing in it that could change your mind, which means it cannot help you choose between two bikes.

In all three the next step is the same: leave the summary and go to the specification, or to the recall databases.

## What summaries cannot tell you

- **They are not a rating.** There is no average behind them, and a summary that sounds enthusiastic can sit on a product with the same reception as one that sounds measured.
- **They say nothing about fit.** No summary in this corpus carries a seat height, and none mentions an inseam. Fit is a measurement question — see the [size chart guide](/guides/beginner/balance-bike-size-chart).
- **They are not a safety check.** Anything that could put a child at risk shows up in the recall databases first, and usually not in retail review text at all. Check [CPSC recalls](https://www.cpsc.gov/Recalls) and the [EU Safety Gate](https://ec.europa.eu/safety-gate) instead.
- **They age.** The corpus behind a summary is only as current as the listing.

## Method

Every figure here is counted from the retailer-generated sentiment summaries attached to the listings in this site's product snapshot, generated 13 October 2026: 174 products published, 164 of them carrying a summary, 159 of those distinct, 14 of the 164 being balance bikes. Themes and hedges are counted by phrase, so a mention is a mention of a topic rather than a rating of it, and one summary can count toward several themes. The balance-bike-only breakdown, and the full method behind it, are on the [buyer feedback reference page](${ASSET_URL}). No summary is treated as a first-hand review, and none of this substitutes for the manufacturer's own specification.

## Further reading

- [What buyers say reference](${ASSET_URL}) — the aggregate per theme, with the source stated at the top.
- [Recalls guide](/guides/risk/balance-bike-recalls) — the two-minute check that matters more.
- [Balance bike by age](/guides/beginner/balance-bike-by-age) — where the category's coverage actually thins out.`;

const ZH = `本站不发星级评分，也没有逐条的用户评价。它有的是每个车型一条零售商生成的"买家情绪摘要"——每件商品几句话的短文。这篇讲的就是怎么诚实地读它。

## 你实际在读的是什么

这类摘要由零售商的系统从自己的评价语料里生成，例如"顾客觉得这辆平衡车好装、结实"。它不是评价，而是对评价的转述，不带评分、不带样本量、也不带日期。在本快照里，平衡车摘要的中位长度是 391 个字符，约六十个词——那是一段话，不是证据。

这个长度带来两个后果。摘要短到无法枚举一款产品的缺点，就不能拿来当"它没有缺点"的证据；里面没有任何测量值，也就无法告诉你这辆车是否合身。

## 为什么"组装"排在最前面

在本快照的 14 条平衡车摘要里，组装每一条都提到，稳定性和重量各自只在 5 条里出现。这不是关于平衡车的发现，而是关于摘要用途的发现：它们是为安抚还没拆箱的人写的，而组装正是下单之前那个担忧。

所以被提到最多的主题，恰恰是最没用的一个。如果你要判断一辆车适不适合个头偏小的两岁孩子，该找的是出现最少的那个主题——[14 条摘要按主题的完整计数](${ASSET_URL})留在参考页上，这里不重复。

## 承载信号的是那些保留项

摘要里大部分有用的内容，在给夸奖打折的从句里。有三种形态要认得：

- **归属于单个买家。** "一位顾客""一些顾客"这类措辞，把一句话收窄成一次个人经历。本品类 14 条里有 12 条这样写，应该当成一个数据点，而不是共识。
- **分歧措辞。** "然而"，或者"虽然有些人……另一些人"——这句话在告诉你，意见分布并没有定下来。14 条里有 6 条是这么写的。
- **点名的缺点。** 三者中最少见，14 条里只有 5 条，也是摘要里唯一能让你采取行动的部分。

一句以夸奖开头、接着越过一个"然而"继续往下写的话，同时在做两件事，而只有第二件对你有用。

## 六十秒读完一条

1. **先找缺点从句。** 大多数摘要都有一个。找不到，说明这条摘要信息量更少，不是产品更好。
2. **凡是点名单个买家的句子都打折。** 一位顾客的经历只是一个数据点。
3. **留具体的，扔形容词。** "到货少两个螺栓"可以行动，"质量很好"不行。
4. **看你关心的事有没有被提到。** 如果你是为个头偏小的两岁孩子买车，而文本始终没提年龄适配，那它在这一项上两边都算不上证据。
5. **然后就别读了。** 391 个字符的摘要替代不了一个座高数字。

## 摘要什么都没告诉你的三种情况

三种情况看起来像信息，其实不是：

- **根本没有摘要。** 本快照已发布的 174 件商品里，有 10 件一条都没有。缺摘要是商品目录的空白，不是对这辆车的评价。
- **摘要是复用的。** 已发布的 164 条摘要里，有 5 条与另一件商品的文本相同，所以这些话可能本来不是写你眼前这辆车的。
- **通篇都是无保留的夸奖。** 既没有缺点从句也没有归属，里面就不存在任何能让你改主意的内容，也就无法帮你在两辆车之间做选择。

这三种情况的下一步都一样：离开摘要，去看规格，或者去看召回数据库。

## 摘要告诉不了你的事

- **它们不是评分。** 背后没有平均值；听起来热情的摘要和听起来克制的摘要，可能落在两款口碑相同的产品上。
- **它们对合身性什么都没说。** 这批语料里没有一条摘要带座高数字，也没有一条提到腿内长。合身是测量问题——见[尺寸指南](/guides/beginner/balance-bike-size-chart)。
- **它们不是安全检查。** 任何可能让孩子受伤的问题，会先出现在召回数据库里，而且通常根本不会出现在零售评价文本里。该查的是 [CPSC 召回](https://www.cpsc.gov/Recalls)和 [EU Safety Gate](https://ec.europa.eu/safety-gate)。
- **它们会过期。** 摘要背后的语料只和当前列表一样新。

## 方法

这里每个数字都数自本站商品快照（生成于 2026 年 10 月 13 日）中挂在商品上的零售商生成情绪摘要：已发布商品 174 件，其中 164 件带摘要，这 164 条里 159 条互不相同，平衡车占其中 14 条。主题与保留项按词组计数，所以一次提及代表提到该话题，而不是对它打分，同一条摘要可以计入多个主题。平衡车口径的完整拆分与完整方法，见[买家评价参考页](${ASSET_URL})。没有任何一条被当作第一手评价，这些也都不替代厂商自己的规格。

## 延伸阅读

- [买家评价参考页](${ASSET_URL})——按主题汇总，顶部写明来源。
- [召回指南](/guides/risk/balance-bike-recalls)——更值得花的那两分钟。
- [按年龄选车](/guides/beginner/balance-bike-by-age)——品类覆盖真正变薄的地方。`;

/**
 * The rewrite removes two sections and adds one, so a plain length check is not
 * much of a guard. What must not change is the parts that are unique to this
 * page: the reading steps and the limits section.
 */
const REQUIRED_MARKERS: Array<{ lang: "en" | "zh"; needle: string; why: string }> = [
  { lang: "en", needle: "## How to read one in sixty seconds", why: "the operational core" },
  { lang: "en", needle: "## What summaries cannot tell you", why: "the limits section" },
  { lang: "en", needle: "## When a summary tells you nothing", why: "the new catalogue-level section" },
  { lang: "en", needle: "/guides/beginner/balance-bike-size-chart", why: "the size-chart cross link" },
  { lang: "en", needle: "/guides/risk/balance-bike-recalls", why: "the recalls cross link" },
  { lang: "zh", needle: "## 六十秒读完一条", why: "the operational core" },
  { lang: "zh", needle: "## 摘要告诉不了你的事", why: "the limits section" },
  { lang: "zh", needle: "## 摘要什么都没告诉你的三种情况", why: "the new catalogue-level section" },
  { lang: "zh", needle: "/guides/beginner/balance-bike-size-chart", why: "the size-chart cross link" },
  { lang: "zh", needle: "/guides/risk/balance-bike-recalls", why: "the recalls cross link" },
];

/** The two count tables that were duplicating the asset page. */
const FORBIDDEN_MARKERS: Array<{ lang: "en" | "zh"; needle: string }> = [
  { lang: "en", needle: "## What they mention" },
  { lang: "en", needle: "## The three hedges" },
  { lang: "zh", needle: "## 它们提到了什么" },
  { lang: "zh", needle: "## 三个保留项" },
];

const NEXT: Record<"en" | "zh", string> = { en: EN, zh: ZH };

console.log(`API base: ${API_BASE}`);
console.log(`Mode:     ${APPLY ? "APPLY (writing to D1)" : "DRY RUN"}`);
console.log(`Target:   ${SLUG} (${ID})`);

for (const { lang, needle, why } of REQUIRED_MARKERS) {
  if (!NEXT[lang].includes(needle)) {
    throw new Error(`${lang} copy is missing "${needle}" (${why})`);
  }
}
for (const { lang, needle } of FORBIDDEN_MARKERS) {
  if (NEXT[lang].includes(needle)) {
    throw new Error(`${lang} copy still contains the retired section "${needle}"`);
  }
}
// Numbered steps must end in punctuation or classifyRichLine() promotes them to
// headings, which is exactly the failure check:richparity exists to catch.
for (const lang of ["en", "zh"] as const) {
  for (const line of NEXT[lang].split("\n")) {
    if (!/^\d+\.\s/.test(line)) continue;
    if (!/[.。！？]$/.test(line.trimEnd())) {
      throw new Error(`${lang} numbered step does not end in punctuation: "${line}"`);
    }
  }
}

const read = async (): Promise<Array<Record<string, unknown>>> => {
  const res = await fetch(`${API_BASE}/api/cms/guides?cb=${Date.now()}`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`guides read failed: HTTP ${res.status}`);
  const payload = (await res.json()) as { data?: unknown };
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  return rows as Array<Record<string, unknown>>;
};

const rows = await read();
const current = rows.find((row) => String(row.id) === ID);
if (!current) throw new Error(`${ID} not found in the guides collection`);
if (String(current.slug) !== SLUG) throw new Error(`slug mismatch: expected ${SLUG}, got ${String(current.slug)}`);

for (const lang of ["en", "zh"] as const) {
  const body = (current[lang] as Record<string, unknown> | undefined) || {};
  const before = String(body.content ?? "");
  const head = before.split("\n").find((line) => line.startsWith("## ")) || "";
  console.log(`\n  ${lang}: ${before.length} -> ${NEXT[lang].length} chars`);
  console.log(`    first heading now: "${head}"`);
  console.log(`    headings before: ${(before.match(/^## /gm) || []).length}, after: ${(NEXT[lang].match(/^## /gm) || []).length}`);
}

// The internal-link note at the foot of the asset page points back here, and the
// reference page is where the counts now live exclusively. Both must survive.
if (!EN.includes(ASSET_URL) || !ZH.includes(ASSET_URL)) {
  throw new Error("the rewrite dropped the link back to the reference page");
}

if (!APPLY) {
  console.log("\nDry run complete. Re-run with --apply to write.");
  process.exit(0);
}
if (!TOKEN) {
  console.error("CMS_ADMIN_ALL_TOKEN is required.");
  process.exit(1);
}

const merged: Record<string, unknown> = { ...current };
for (const lang of ["en", "zh"] as const) {
  const body = (current[lang] as Record<string, unknown> | undefined) || {};
  if (!("title" in body)) throw new Error(`${lang} body has no title field — refusing to touch it`);
  merged[lang] = { ...body, content: NEXT[lang] };
}
merged.updatedAt = new Date().toISOString();

const post = await fetch(`${API_BASE}/api/cms/guides/save`, {
  method: "POST",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "x-cms-admin-token": TOKEN,
  },
  body: JSON.stringify(merged),
});
if (!post.ok) {
  const text = await post.text();
  throw new Error(`save failed: HTTP ${post.status} ${text.slice(0, 300)}`);
}
console.log("\n  saved");

let failed = false;
const verifyRows = await read();
const row = verifyRows.find((entry) => String(entry.id) === ID);
if (!row) throw new Error(`verification read could not find ${ID}`);
for (const lang of ["en", "zh"] as const) {
  const body = (row[lang] as Record<string, unknown> | undefined) || {};
  const live = String(body.content ?? "");
  if (live !== NEXT[lang]) {
    console.error(`  VERIFY FAILED ${lang}: live content differs (${live.length} vs ${NEXT[lang].length} chars)`);
    failed = true;
    continue;
  }
  console.log(`  ${lang} verified (${live.length} chars)`);
}
// seo + H1 are owned by set-guides-intent-split.ts; make sure the whole-record
// replace did not drop them.
const seo = (row.seo as Record<string, unknown> | undefined) || {};
for (const lang of ["en", "zh"] as const) {
  const langSeo = (seo[lang] as Record<string, unknown> | undefined) || {};
  const title = String(langSeo.title ?? "");
  if (!title) {
    console.error(`  VERIFY FAILED ${lang}.seo.title is empty after the write`);
    failed = true;
  }
}

if (failed) {
  console.error("\nVerification failed.");
  process.exit(1);
}
console.log("\n[ok] what-buyers-say guide rewritten to the reading angle, verified live.");
