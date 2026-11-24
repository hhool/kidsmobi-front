/**
 * R48 — fill the guides category×topic gaps, batch 2: balance.
 *
 * WHY THIS BATCH. The category axis has 35 composite pages and 24 of them sit
 * below COMPOSITE_INDEX_THRESHOLD (3 articles), so they exist, are linked
 * internally, and carry noindex,follow — a URL the site advertises that can
 * never earn an index entry. Balance is the second-deepest family (14 live
 * published guides after the retired stability guide is excluded) and has five
 * combinations at one article each:
 *
 *   /guides/balance/scenario/      1  -> needs 2
 *   /guides/balance/budget/        1  -> needs 2
 *   /guides/balance/special/       1  -> needs 2
 *   /guides/balance/maintenance/   1  -> needs 2
 *   /guides/balance/best/          1  -> needs 2
 *
 * Ten articles take all five to 3. The counts are computed against the same
 * filtered set the prerender sees: `balance-bike-stability` is still published
 * in the CMS but is RETIRED (301 to /balance-bike-stability/), and the prerender
 * drops it before it counts anything. Counting CMS rows rather than prerendered
 * pages overstates scenario by one and would have shipped a batch that leaves
 * the combination still below the bar.
 *
 * GROUNDING RULE (unchanged across every batch). The site is an editorial
 * publisher with no laboratory, so this copy:
 *   - states no third-party figure: no model weights, no prices, no load limits,
 *     no recall conclusions, no certification claims.
 *   - makes no first-person measurement claim (see FORBIDDEN_EN / FORBIDDEN_ZH
 *     in lib/guide-batch.mjs; that is the single vocabulary for the rule, so
 *     naming the phrases again here would only risk drifting from it).
 *     check-honesty-claims.ts scans the built HTML for exactly these.
 *   - argues from published-document structure instead: which question a spec
 *     sheet answers, which line on a listing is the one that matters, what a
 *     standard number does and does not promise. That is checkable by the reader
 *     at the source, which is the point.
 *
 * The product facts this copy does use are deliberately generic and true of this
 * catalogue by inspection: balance bikes are listed with a stated seat height and
 * a stated maximum rider weight, and those two numbers decide whether a given
 * child can ride. Nothing is attributed to a named model.
 *
 * CONTRACT
 *   - Creates 10 NEW records. Never edits an existing one.
 *   - Refuses to run if a slug already exists (no silent overwrite).
 *   - Idempotent: a second --apply skips every slug it already wrote.
 *   - All copy checks live in scripts/lib/guide-batch.mjs, shared with every
 *     other batch, so the rules cannot drift between them.
 *
 * Usage:
 *   node scripts/fill-guides-balance-gaps.mjs              # dry run
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/fill-guides-balance-gaps.mjs --apply
 *   node scripts/fill-guides-balance-gaps.mjs --sql        # emit a D1 .sql file
 *   node scripts/fill-guides-balance-gaps.mjs --verify     # re-fetch and assert
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  CHANNEL_TOPICS,
  assertCopy,
  buildRecord,
  collectKnownRoutes,
  coverKey,
  emitSql,
  nonGuideTargets,
  request,
  unwrap,
  wordCount,
} from "./lib/guide-batch.mjs";

const APPLY = process.argv.includes("--apply");
const VERIFY = process.argv.includes("--verify");
const EMIT_SQL = process.argv.includes("--sql");
const API_BASE = (process.env.CMS_API_BASE || "https://store.balancebiketoddler.com").replace(/\/+$/, "");
const TOKEN = String(process.env.CMS_ADMIN_ALL_TOKEN || "").trim();

const PRODUCT_CATEGORY = "balance";
const BATCH_LABEL = "b2-balance";

const IMG = "https://store.balancebiketoddler.com/balance_bike";

/**
 * The ten articles.
 *
 * `links` inside the bodies are asserted at run time against the live published
 * slug list AND against each target's own topic segment, so a renamed or
 * re-filed target fails the script instead of shipping a 404 into body copy.
 *
 * NOTE on the stability guide: `balance-bike-stability` is RETIRED (S4) and 301s
 * to the asset page /balance-bike-stability/. A body link must therefore go to
 * the asset URL, never to /guides/scenario/balance-bike-stability.
 */
const ARTICLES = [
  // ---- balance / scenario (1 -> 3) ------------------------------------
  {
    slug: "balance-bike-indoors-and-small-spaces",
    title: "Balance Bike Indoors and in Small Flats",
    description:
      "Whether a balance bike belongs inside at all: floor protection, turning space, and the door-width question that decides it before you buy.",
    keywords: ["balance bike indoors", "balance bike apartment", "riding balance bike inside", "small space balance bike"],
    zhTitle: "平衡车能不能在室内骑：小户型与公寓的取舍",
    zhDescription:
      "平衡车到底该不该进室内：地板保护、转弯空间，以及买之前就能定论的门宽问题。",
    zhKeywords: ["平衡车室内", "公寓平衡车", "室内骑行平衡车", "小户型平衡车"],
    topic: "scenario",
    topicOrder: 11,
    cover: `${IMG}/Umatoll/Rank_6_ASIN_B0CR6VKXJ7_Umatoll%20Colorful%20Lighting%20Baby%20Balance%20Bike%20Toys%20f/images/primary.jpg`,
    en: `A balance bike indoors is not a compromise on the bike. It is a question about the room, and the room answers it before the bike does.

## The door and the corridor decide it
Two numbers on the floor plan matter more than anything on the listing. The first is the clear width of the narrowest door the bike has to pass through, with the door actually open — not the nominal frame width. The second is the longest straight run available, because a bike that can only be walked in a circle teaches nothing.

A balance bike travels at walking pace at first, so the honest test is whether an adult can walk beside it. If the corridor is only wide enough for the bike, the child is steering with no margin for error, and the first wobble ends against a wall. That is not a safety failure, but it is the reason most indoor bikes get put away in a week.

## Floor surfaces are the real cost
Indoor riding wears two things: the tyre and the floor. Hard narrow wheels on a hard floor transfer every vibration upward, and a child learning to balance reads vibration as instability. Some catalogue wheels are described as foam or EVA rather than pneumatic, and those are the ones described as indoor-friendly — which is a statement about the material, not a claim about your floor.

The floor side is simpler: a rug at the turning point is the whole mitigation. Anything more elaborate is furniture.

## What "indoors" should actually be used for
Indoor time earns its place as a confidence loop, not as practice mileage. Ten minutes of free rolling in a familiar space does something outdoor riding does not: it removes the audience, and a child who is not being watched tries the thing they were avoiding.

Keep the sessions short and stop them before fatigue, because the last minute of a tired session is where habits form that have to be unlearned outside. [Where to ride a balance bike](/guides/scenario/where-to-ride-balance-bike) covers the outdoor progression this feeds into, and [balance bike size chart](/guides/beginner/balance-bike-size-chart) settles whether the bike is even the right height for the child before any of this matters.

## The case against
If the flat has no run longer than a few metres and every floor is hard, an indoor bike is a storage problem with a safety claim attached. The honest alternative is a mat and a hallway, or waiting for the park. [Balance bike vs training wheels](/guides/beginner/balance-bike-vs-training-wheels) is worth reading first if the indoor case is being argued as a reason to skip outdoor practice entirely, because the two vehicles train different things.

## Extension reading
- [Balance bikes for twins and siblings](/guides/special/balance-bikes-for-twins-and-siblings)
- [Balance bike tyre and wheel care](/guides/maintenance/balance-bike-tyre-and-wheel-care)
- [Balance bikes hub](/products/balance-bikes/)`,
    zh: `平衡车进不进室内，不是一个关于车的问题，而是一个关于房间的问题——而且房间比车先给出答案。

## 门和走道先定结论
户型图上只有两个数字比商品页上任何参数都重要。第一是最窄那道门的实际净宽，要按门真正打开后的净宽算，不是门框标称宽度。第二是可用的最长直线距离，因为只能原地绕圈的场地什么都教不了。

平衡车起步时是步行速度，所以最诚实的判据是：大人能不能并排走在旁边。如果走道只够放下车，孩子的转向就没有容错余量，第一次摇晃就会撞上墙。这不算安全事故，但这正是大多数室内车一周后被收起来的原因。

## 地板才是真实代价
室内骑行磨损两样东西：轮胎和地板。硬质窄轮在硬质地面上会把每一点震动都向上传，而正在学平衡的孩子会把震动读成「不稳」。目录里有些轮子标注为泡棉或 EVA 而不是充气胎，标注为「适合室内」的通常就是这一类——那是对材质的陈述，不是对你家地面的承诺。

地板这一侧更简单：转角处铺一块地毯就是全部缓解措施。再复杂的做法都是家居问题，不是车的问题。

## 「室内」到底该用来做什么
室内时间的价值是信心回路，不是训练里程。在熟悉的空间里自由滑十分钟，能做到户外做不到的一件事：去掉观众。没有人在看的孩子，才会去试他一直在回避的那个动作。

时间要短，并且要在疲劳之前结束，因为一次疲惫训练的最后一分钟，正是坏习惯形成的时刻，而这些习惯到了户外还要重新纠正。[平衡车该在哪骑](/guides/scenario/where-to-ride-balance-bike)讲的是室内时间如何衔接户外进阶；而[平衡车尺寸对照](/guides/beginner/balance-bike-size-chart)决定的是，在讨论这些之前，这台车的高度对孩子到底合不合适。

## 反方意见
如果家里找不出一段超过几米的直线，而且地面全是硬的，那么室内车就是一个附带安全说辞的收纳难题。诚实的替代方案是一块垫子加一条走廊，或者干脆等去公园。如果「可以室内骑」正被当成跳过户外练习的理由，先读[平衡车 vs 训练轮](/guides/beginner/balance-bike-vs-training-wheels)——这两种车训练的是不同的东西。

## 延伸阅读
- [双胞胎与兄弟姐妹的平衡车](/guides/special/balance-bikes-for-twins-and-siblings)
- [平衡车轮胎与轮组保养](/guides/maintenance/balance-bike-tyre-and-wheel-care)
- [平衡车品类页](/products/balance-bikes/)`,
  },
  {
    slug: "balance-bike-first-two-weeks",
    title: "The First Two Weeks on a Balance Bike",
    description:
      "A week-by-week look at what a child actually does with a balance bike at first, and which adult reactions help versus which ones reset progress.",
    keywords: ["first balance bike", "balance bike learning stages", "teaching balance bike", "balance bike first week"],
    zhTitle: "平衡车的前两周：孩子实际会做什么",
    zhDescription:
      "按周拆解孩子最初接触平衡车的真实行为，并区分哪些大人反应有帮助、哪些会让进度倒退。",
    zhKeywords: ["第一台平衡车", "平衡车学习阶段", "怎么教平衡车", "平衡车第一周"],
    topic: "scenario",
    topicOrder: 12,
    cover: `${IMG}/JMMD/Rank_4_ASIN_B0CFDX97YD_JMMD%206%20in%201%20Toddler%20Bike%20with%20Push%20Handle%20for%20Kids/images/primary.jpg`,
    en: `The first two weeks are not a training programme. They are a sequence of small refusals, and the adult's job is to not treat a refusal as a setback.

## Week one: the bike is furniture
Expect the bike to be sat on, walked around, and pushed backwards more than it is ridden forwards. This is not a delay. A child who has straddled the bike twenty times in a hallway has already learned the most important thing: that it stays upright between their legs when they are not moving.

Two adult habits matter here. Do not lift the child onto the bike, and do not hold the handlebars. Both remove the exact feedback the child is collecting. Standing beside the bike is enough.

The other thing week one settles is the seat height. A bike set too high forces tip-toe contact and reads as unstable before the child has moved. [Balance bike size chart](/guides/beginner/balance-bike-size-chart) has the flat-foot test; re-check it at the end of week one, because a child who has stopped resisting the bike will now stand differently on it.

## Week two: the glide appears, briefly
Somewhere in the second week most children produce a short glide — two or three metres with both feet off the ground — and then immediately stop doing it. That stop is normal and worth naming, because it is the moment most adults over-correct.

The glide is not a skill being performed. It is a balance moment that happened because the child forgot to be careful. Praise aimed at the glide ("do that again") makes it a performance, and a performance is something to fail at. Praise aimed at the attempt ("you went a long way") leaves it as play.

## What actually slows progress
Three things, all of them adult-side:

The first is a schedule. Balance bikes do not respond to drills; they respond to being the thing the child chooses.

The second is a running adult. A parent jogging alongside signals that a catch is coming, and a child who expects a catch will not commit weight forward. Walk behind instead.

The third is a bike that changed height mid-week. Any adjustment resets the body's sense of where the ground is. Set it once, then leave it.

## What the two weeks are actually for
They prove the bike is the right size and the child is willing to sit on it. Both are prerequisites, neither is skill. Actual gliding builds over months, and [where to ride a balance bike](/guides/scenario/where-to-ride-balance-bike) is the next decision because terrain changes how fast that happens.

If the child is still refusing the bike entirely at two weeks, the useful question is not about technique. Check the seat height again, then check whether the bike is heavier than the child can manage — [balance bike weight](/guides/beginner/balance-bike-weight) covers the ratio that matters.

## Extension reading
- [Balance bike indoors and in small flats](/guides/scenario/balance-bike-indoors-and-small-spaces)
- [Balance bike maintenance](/guides/maintenance/balance-bike-maintenance)
- [Balance bikes hub](/products/balance-bikes/)`,
    zh: `前两周不是一个训练计划，而是一连串小小的拒绝；大人的任务是不把「拒绝」当成退步。

## 第一周：车是家具
请预期这台车被坐上去、被绕着走、被往后退的次数，远多于被向前骑。这不是延迟。一个在走廊里跨上车二十次的孩子，已经学到了最重要的一件事：在不移动的时候，车会稳稳待在两腿之间。

有两个大人习惯在这一周很关键。不要把孩​子抱上车，也不要扶着车把。这两件事都会拿掉孩子正在收集的那种反馈。站在车旁就够了。

第一周还会定下座高。座高过高会让孩子只能用脚尖点地，人还没动，「不稳」的印象就已经先成立。[平衡车尺寸对照](/guides/beginner/balance-bike-size-chart)里有平脚掌测试；在第一周结束时再测一次，因为一个不再抗拒这台车的孩子，站在车上的方式会和之前不同。

## 第二周：滑行短暂出现
在第二周的某个时刻，多数孩子会做出一次很短的滑行——双脚离地两三米——然后立刻就不再做了。这个「停」是正常的，也值得被说出来，因为大多数大人正是在这一刻过度纠正。

滑行不是在被表演的技能，而是一次因为忘了小心才发生的平衡瞬间。把表扬对准滑行本身（「再来一次」）会把它变成表演，而表演是可以失败的。把表扬对准尝试（「你走了好远」）则让它继续是玩。

## 真正拖慢进度的是什么
三件事，全在大人这一侧。

第一是日程表。平衡车不响应操练，它只响应「这是孩子自己选的那件事」。

第二是跟着跑的大人。并肩小跑的父母会传递「马上有人接住」的信号，而预期被接住的孩子不会把重心往前交。改为走在后面。

第三是周中改过高度。任何调整都会重置孩子对身体与地面关系的感知。设一次，然后别动。

## 这两周到底在验证什么
它在验证两件事：车的大小合适，孩子愿意坐上去。两者都是前提，都不是技能。真正的滑行是以月为单位长出来的，而[平衡车该在哪骑](/guides/scenario/where-to-ride-balance-bike)是下一个决定，因为地形会改变它发生的速度。

如果两周后孩子依然完全拒绝这台车，有用的提问与技法无关。先重新量座高，再确认这台车是不是重于孩子能掌控的程度——[平衡车重量](/guides/beginner/balance-bike-weight)讲的是那个真正起作用的比值。

## 延伸阅读
- [平衡车室内与小户型](/guides/scenario/balance-bike-indoors-and-small-spaces)
- [平衡车保养](/guides/maintenance/balance-bike-maintenance)
- [平衡车品类页](/products/balance-bikes/)`,
  },

  // ---- balance / budget (1 -> 3) --------------------------------------
  {
    slug: "balance-bike-under-100",
    title: "A Balance Bike Under 100: What You Get",
    description:
      "What the lowest price band can and cannot deliver on a balance bike, and the three listing details that separate a usable cheap bike from a wasted one.",
    keywords: ["balance bike under 100", "cheap balance bike", "budget balance bike buying", "inexpensive balance bike"],
    zhTitle: "百元级平衡车：这个价位能给到什么",
    zhDescription:
      "最低价位段在平衡车上能做到与做不到的事，以及区分「能用的便宜车」与「白买」的三处商品页细节。",
    zhKeywords: ["百元平衡车", "便宜平衡车", "平价平衡车选购", "低价平衡车"],
    topic: "budget",
    topicOrder: 11,
    cover: `${IMG}/Retrospec/Rank_Similar_ASIN_B0DZ4BNZDR_Retrospec%20Cricket%202%20Baby%20Walker%20Balance%20Bike%20with/images/primary.jpg`,
    en: `A balance bike does not have many parts, which is why a low price is not automatically a bad sign. The question is which parts the price came out of.

## What the floor actually buys
The minimum a balance bike has to do is narrow. It has to hold a child up at a stated maximum weight, keep both feet on the ground with the child seated, and steer without the front wheel and the frame disagreeing about direction. Nothing in that list requires expensive material.

So a cheap balance bike can be genuinely fine. What it usually will not have is any adjustment — a fixed seat height, a fixed bar height, and the assumption that the child is close to average for the age on the box. That is a real limit, but it is a limit on how long the bike fits, not on whether it is safe.

## Three listing details that decide it
**A stated maximum rider weight.** Not "suitable for ages 1-3". A weight is a number that can be checked against a child; an age band is a marketing range that often spans children whose weights differ by half. A listing that gives only the age band has told you what it does not know.

**The seat height, in a unit.** Measured from the ground to the top of the saddle. This is the one number that decides whether the flat-foot position is reachable, and [balance bike size chart](/guides/beginner/balance-bike-size-chart) is the page that turns it into a decision.

**Frame material, named.** Steel, aluminium, or wood, stated as a material. "Durable frame" describes a wish. The reason it matters is weight, and [balance bike weight](/guides/beginner/balance-bike-weight) explains why the child-to-bike ratio is the thing being traded at this price.

## Where the savings come from
Three cuts are normal and mostly harmless at this band: painted rather than anodised finish, a saddle that is stapled rather than moulded, and bearings that are bushed rather than sealed. All three shorten the bike's life in a household that rides daily, and none of them make the first year unsafe.

Two cuts are not normal and are worth walking away from: no stated maximum weight anywhere in the listing, and a headset that visibly moves when the bars are turned by hand. The first means nobody has published the limit. The second is a defect you can see without riding.

## The honest comparison
At this band the bike is often outgrown before it wears out, which makes resale or a second child the thing that decides value — see [balance bike resale and hand-me-downs](/guides/budget/balance-bike-resale-and-hand-me-downs). If the child is near the top of the stated weight or is unusually tall, the fixed geometry is the binding constraint and [balance bikes for tall and short kids](/guides/special/balance-bikes-for-tall-and-short-kids) is the more useful read than any price comparison.

## Extension reading
- [Balance bike price tiers](/guides/budget/balance-bike-price-tiers)
- [Balance bike frame and fastener checks](/guides/maintenance/balance-bike-frame-and-fastener-checks)
- [Balance bikes hub](/products/balance-bikes/)`,
    zh: `平衡车的零件并不多，所以低价本身不等于坏信号。真正的问题是：这个价格是从哪几个零件里省出来的。

## 底线价位究竟买到了什么
平衡车的最低要求其实很窄：能在标明最大体重内承托住孩子；孩子坐上去时双脚能落地；转向时前轮和车架不会对「往哪走」产生分歧。这份清单里没有任何一项需要昂贵材料。

所以便宜的平衡车可以是真正能用的。它通常没有的是任何可调性——固定座高、固定把高，并默认孩子的身材接近包装上那个年龄段的平均。这是真实的限制，但它限制的是「能合身多久」，而不是「安不安全」。

## 决定成败的三处商品页细节
**标明最大承重。** 不是「适合 1-3 岁」。体重是可以拿去和孩子对照的数字；年龄段是一个营销区间，同一个区间里孩子的体重常常差出一半。只写年龄段的页面，等于告诉你它不知道这个数。

**带单位的座高。** 从地面量到座垫顶面。这是唯一决定「能不能平脚掌落地」的数字，而[平衡车尺寸对照](/guides/beginner/balance-bike-size-chart)这一页，就是把它变成一个决定的地方。

**点名材质的车架。** 钢、铝或木，作为材料写出来。「坚固车架」描述的是愿望。它之所以重要是因为重量，而[平衡车重量](/guides/beginner/balance-bike-weight)解释了为什么在这个价位被交易掉的正是「孩子与车的重量比」。

## 省下来的钱来自哪里
这一档有三处削减是正常的，基本无害：喷漆而非阳极氧化、订书钉固定而非模压成型的座垫、衬套而非密封轴承。在一个每天骑的家庭里，这三点都会缩短车的寿命，但都不会让第一年变得不安全。

有两处削减不正常，值得转身就走：整页都找不到最大承重；用手转车把时，头管处能看见活动。前者意味着没有任何人公布过这个上限；后者是不用骑就能看出来的缺陷。

## 诚实的比较
在这一档，车往往是在被骑坏之前就先不合身了，所以真正决定性价比的是转卖或给第二个孩子用——见[平衡车转卖与二手](/guides/budget/balance-bike-resale-and-hand-me-downs)。如果孩子已经接近标明承重的上限，或者身高明显偏高，那么固定的几何才是真正的约束，此时[高矮孩子的平衡车](/guides/special/balance-bikes-for-tall-and-short-kids)比任何价格对比都更值得读。

## 延伸阅读
- [平衡车价格分档](/guides/budget/balance-bike-price-tiers)
- [平衡车车架与紧固件检查](/guides/maintenance/balance-bike-frame-and-fastener-checks)
- [平衡车品类页](/products/balance-bikes/)`,
  },
  {
    slug: "balance-bike-resale-and-hand-me-downs",
    title: "Balance Bike Resale and Hand-Me-Downs",
    description:
      "What a balance bike is worth second-hand, which wear items decide it, and the checks that make a hand-me-down safe rather than merely free.",
    keywords: ["balance bike resale", "used balance bike", "hand me down balance bike", "second hand balance bike"],
    zhTitle: "平衡车转卖与二手上手：值钱的是什么",
    zhDescription:
      "二手平衡车还值多少、哪些磨损项决定价格，以及让一台旧车「能用」而不只是「免费」的检查。",
    zhKeywords: ["平衡车转卖", "二手平衡车", "平衡车二手", "平衡车回收"],
    topic: "budget",
    topicOrder: 12,
    cover: `${IMG}/KRIDDO/Rank_Similar_ASIN_B0D2NGJ164_KRIDDO%202-in-1%20Kids%20Tricycle%20and%20Toddler%20Balance%20Bi/images/primary.jpg`,
    en: `A balance bike is one of the few children's purchases whose second life is nearly as long as its first. That changes how the first purchase should be judged.

## The bike is outgrown, not worn out
A child typically gets two to three years from a balance bike, and the limit is almost always seat height rather than failure. That means the used market is full of bikes with most of their life left, which is good news for a buyer and the reason the original purchase should weigh resale from the start.

Two features decide resale more than condition does. Adjustability first: a bike with a stated range of seat heights fits a second child, and a fixed-height bike fits only children near that height. Frame material second, because a material that does not corrode survives storage in a garage, and storage is where most used bikes have spent their idle time.

## The three wear items
**Tyres.** Foam and EVA tyres do not go flat, and they also do not recover from a flat spot. A used bike whose wheels were left parked on one spot for a season will have a wobble that cannot be adjusted out. Spin both wheels and watch the rim line against the fork; a rim that moves side to side is a wheel that has been hit, not merely worn.

**Bearings.** Lift the bike and spin each wheel by hand. It should keep turning briefly and stop without grinding. A wheel that stops immediately is dry, and a wheel that clicks is a bearing that has lost its seal. Both are replaceable, and both are a negotiating point rather than a disqualifier.

**The headset and the clamp.** Hold the front wheel between your knees and turn the bars. Any movement between bar and fork is play in the headset. This is the one wear item that is a genuine safety question, and [balance bike frame and fastener checks](/guides/maintenance/balance-bike-frame-and-fastener-checks) walks through what to look at.

## What a hand-me-down needs before it is ridden
Free is not the same as ready. Three checks, in this order: the seat height against the new child (a bike handed down from an older sibling is usually too tall and, less obviously, sometimes has been adjusted to the old child and never moved back — see [balance bike size chart](/guides/beginner/balance-bike-size-chart)); the fasteners, because a bike that sat assembled in a garage for a year has had one season of vibration working on every bolt; and the tyres, as above.

Skip the cosmetic assessment entirely. Scratches on a painted frame are a story about use, not a defect.

## When a hand-me-down is the wrong call
If the bike is fixed-height and the new child is at either end of the range the original child occupied, no amount of adjustment helps, and the honest move is to pass it on again. The same is true of a bike whose maximum stated weight the child already exceeds — if that number is not published on the bike, treat the frame's condition as unknown rather than assuming it is fine.

## Extension reading
- [A balance bike under 100](/guides/budget/balance-bike-under-100)
- [Balance bike maintenance](/guides/maintenance/balance-bike-maintenance)
- [Balance bikes hub](/products/balance-bikes/)`,
    zh: `平衡车是少数「第二段寿命几乎和第一段一样长」的儿童用品。这会反过来改变第一台车该怎么挑。

## 被长高淘汰，而不是被骑坏
孩子通常能从一台平衡车得到两到三年，而限制几乎总是座高，而不是损坏。这意味着二手市场里全是「寿命还剩大半」的车——对买家是好消息，也正是第一台车从下单时就该把转卖算进去的理由。

决定转卖价值的，有两项比成色更重要。第一是可调性：标明座高区间的车能适配下一个孩子，固定座高的车只适配接近那个高度的孩子。第二是车架材质，因为不易锈蚀的材质能扛住车库存放，而多数二手车闲置的时间都在车库里。

## 三个真正的磨损项
**轮胎。** 泡棉与 EVA 胎不会爆胎，但也不会从「压平点」里恢复。一台车轮子在一个位置停了一整季的二手车，会带有调不掉的摆动。把两个轮子都转起来，看轮圈对着前叉的线；轮圈左右摆动的，是被撞过的轮子，不只是被磨过的轮子。

**轴承。** 把车提起来，用手拨每个轮子。它应当能短暂续转，然后无涩滞地停下。立刻停住的是干涩，带咔哒声的是失去密封的轴承。两者都可更换，也都是议价的理由，而不是否决的理由。

**头管与夹紧件。** 用两膝夹住前轮，转动车把。车把与前叉之间任何相对活动，都是头管旷量。这是唯一属于真正安全问题的磨损项，[平衡车车架与紧固件检查](/guides/maintenance/balance-bike-frame-and-fastener-checks)讲了具体看哪里。

## 一台二手车上路前需要什么
免费不等于可以使用。三项检查，按这个顺序：座高对新孩子是否合适（哥哥姐姐传下来的车通常偏高，而且更隐蔽的一点是——它曾被调到原来那个孩子的位置，之后就没再动过，见[平衡车尺寸对照](/guides/beginner/balance-bike-size-chart)）；紧固件，因为一台装配状态在车库放了一年的车，等于让每个螺栓承受了一整季的振动；以及上面说的轮胎。

外观评估可以整段跳过。喷漆车架上的划痕讲述的是使用经历，不是缺陷。

## 什么情况下这台二手车不该接
如果车是固定座高，而新孩子正好落在原来那个孩子身高区间的两端之外，那么再多的调整都没用，诚实的做法是继续传下去。孩子已经超过标明最大承重的车也一样——如果那个数字在车上根本没写，就把车架状况当作未知来处理，而不是假设它没问题。

## 延伸阅读
- [百元级平衡车](/guides/budget/balance-bike-under-100)
- [平衡车保养](/guides/maintenance/balance-bike-maintenance)
- [平衡车品类页](/products/balance-bikes/)`,
  },

  // ---- balance / special (1 -> 3) -------------------------------------
  {
    slug: "balance-bikes-for-tall-and-short-kids",
    title: "Balance Bikes for Tall and Short Kids",
    description:
      "When a child falls outside the average range, seat-height range matters more than any other line on the listing. How to read it, and what to give up.",
    keywords: ["balance bike for tall child", "balance bike for short child", "balance bike seat height range", "small balance bike"],
    zhTitle: "偏高偏矮的孩子怎么挑平衡车",
    zhDescription:
      "当孩子不在平均身材区间里，座高区间就比商品页上任何一行都重要。怎么读它，以及要放弃什么。",
    zhKeywords: ["高个孩子平衡车", "矮个孩子平衡车", "平衡车座高区间", "小号平衡车"],
    topic: "special",
    topicOrder: 11,
    cover: `${IMG}/Colorful/Rank_Similar_ASIN_B0CCY6YRS8_Colorful%20Lighting%20Baby%20Balance%20Bike%20Toys%20for%201%20Yea/images/primary.jpg`,
    en: `Most balance bike advice is written for the middle of the distribution. A child outside it needs one number more than any other, and the rest of the advice rearranges itself around that.

## The number is the seat-height range, not the age band
The flat-foot position is the whole game: seated on the saddle, both feet flat on the ground, knees slightly bent. If that is not reachable, the child cannot stop, cannot start, and cannot catch a wobble. Nothing else on the listing compensates.

So the line to look for is a seat height given as a range — minimum to maximum, in a unit. A single number is only useful if the child happens to sit exactly at it. A range tells you both whether the bike fits today and how long it will fit, which is the question that decides value.

[Balance bike size chart](/guides/beginner/balance-bike-size-chart) turns a barefoot inseam measurement into a target seat height. Measure the child, then find the bike, in that order.

## The short child
The binding constraint is the minimum seat height, and it is usually worse than the listings suggest. A bike whose lowest setting is a centimetre or two too high produces a child who rides on the balls of their feet, and that posture is the origin of most "my child won't sit on it" reports.

Two things help. First, a bike that is light enough that the child can pick it up when it does fall — [balance bike weight](/guides/beginner/balance-bike-weight) is the relevant page, because a heavy bike at an awkward height is doubly discouraging. Second, accepting that the bike may be a season early: a bike that fits in six months is a bike to buy in six months.

## The tall child
Here the constraint is the maximum, and the failure is different: a child who has outgrown the saddle but not the bike will ride with their knees high and their weight back, which looks like poor balance and is actually poor geometry.

The other tall-child problem is bar height, which is often fixed even when the saddle adjusts. A child who has to stoop to reach the bars will not stay on for long. If the bars do not adjust, the bike has a ceiling that the saddle range does not advertise.

## What to give up
At either end of the range, expect to give up one of two things: either the lowest price band, because fully adjustable geometry costs more; or the resale, because a bike sized for an unusual child fits fewer second owners. [Balance bike resale and hand-me-downs](/guides/budget/balance-bike-resale-and-hand-me-downs) covers how that trade usually resolves.

What should not be given up is the flat-foot position. A bike that is one season too big does not become usable by waiting a month; it becomes usable by waiting the season.

If the child also needs additional postural support rather than just a different height, that is a different question — [balance bikes for kids who need support](/guides/special/balance-bikes-extra-support) is the page for it.

## Extension reading
- [How to choose a balance bike by age](/guides/beginner/balance-bike-by-age)
- [Balance bikes for twins and siblings](/guides/special/balance-bikes-for-twins-and-siblings)
- [Balance bikes hub](/products/balance-bikes/)`,
    zh: `多数平衡车建议是写给分布曲线中段的。一个不在中段的孩子，只需要一个数字胜过其他一切，而其余建议会围绕它重新排列。

## 那个数字是座高区间，不是年龄段
整件事就落在「平脚掌坐姿」上：坐在座垫上，双脚完全落地，膝盖微弯。如果做不到，孩子就停不下来、起不了步、也接不住一次摇晃。商品页上没有任何其他一行能弥补这一点。

所以要找的那一行，是以区间形式给出的座高——最小值到最大值，带单位。单一数字只有在孩子恰好坐在那个高度时才有用。区间同时回答两个问题：今天合不合身，以及还能合身多久——而后者才决定性价比。

[平衡车尺寸对照](/guides/beginner/balance-bike-size-chart)把赤脚内缝长换算成目标座高。先量孩子，再找车，顺序如此。

## 偏矮的孩子
约束在最小座高，而且通常比商品页暗示的更紧。最低档仍高一两厘米的车，会让孩子用前脚掌骑——而这种姿态正是「我家孩子不肯坐上去」这类反馈的主要来源。

有两点能帮上忙。第一，车要轻到倒了孩子自己能扶起来——[平衡车重量](/guides/beginner/balance-bike-weight)是相关页面，因为一台在别扭高度上的重车会双重打击积极性。第二，接受这台车可能早了一季：一台六个月后才合身的车，就是六个月后再买的车。

## 偏高的孩子
这里的约束是最大值，而失败方式不同：一个座垫已经不够高、但车还没换的孩子，会高抬膝盖、重心后坐地骑——看起来像平衡差，实际是几何不对。

偏高孩子的第二个问题是把高，而把高往往是固定的，即使座垫可调。要弯腰才够到车把的孩子骑不久。如果车把不可调，这台车就有一个座高区间并未写明的上限。

## 要放弃什么
在区间两端，请预期放弃二者之一：要么放弃最低价位段，因为完整可调的几何更贵；要么放弃转卖，因为为非典型身材定制的车，能接手的第二任主人更少。[平衡车转卖与二手](/guides/budget/balance-bike-resale-and-hand-me-downs)讲了这种取舍通常怎么收场。

不能放弃的是平脚掌坐姿。一台大了一季的车，不会因为等一个月就变得能用；它是因为等了一整季才变得能用。

如果孩子需要的是额外的姿势支撑，而不只是不同的高度，那是另一个问题——[需要支撑的孩子怎么选平衡车](/guides/special/balance-bikes-extra-support)是那一页。

## 延伸阅读
- [怎么按年龄选平衡车](/guides/beginner/balance-bike-by-age)
- [双胞胎与兄弟姐妹的平衡车](/guides/special/balance-bikes-for-twins-and-siblings)
- [平衡车品类页](/products/balance-bikes/)`,
  },
  {
    slug: "balance-bikes-for-twins-and-siblings",
    title: "Balance Bikes for Twins and Siblings",
    description:
      "Buying for two children at once: whether identical bikes help or hurt, how to handle a size gap, and the sharing rules that prevent rivalry.",
    keywords: ["balance bike for twins", "two balance bikes", "siblings balance bike", "balance bike sharing"],
    zhTitle: "双胞胎与兄弟姐妹：一次买两台平衡车",
    zhDescription:
      "同时为两个孩子买平衡车：一模一样的车是帮忙还是添乱、身高差怎么处理，以及能避免争抢的规则。",
    zhKeywords: ["双胞胎平衡车", "两台平衡车", "兄弟姐妹平衡车", "平衡车分享"],
    topic: "special",
    topicOrder: 12,
    cover: `${IMG}/Gamfeiny/Rank_2_ASIN_B0BLMF98S8_Gamfeiny%20Colorful%20Lighting%20Baby%20Balance%20Bike%20Toys/images/primary.jpg`,
    en: `Two children and one bike is a scheduling problem. Two children and two bikes is a geometry problem, and it is the one that gets missed.

## Identical or different
The instinct is to buy two of the same, which is the right answer only if the children are the same size. Twins of the same age are frequently not: a height difference of a few centimetres at this age is ordinary, and a few centimetres is exactly the margin between flat-foot and tip-toe.

An identical pair therefore often means one child rides a correctly sized bike and the other rides one that is slightly wrong. The child on the wrong one is the one who loses interest, and the parent usually reads that as temperament rather than fit.

## The size gap, handled directly
Measure both children, decide the seat height each one needs, then decide whether one model covers both. That is the only order that works — [balance bike size chart](/guides/beginner/balance-bike-size-chart) has the measurement method, and [balance bikes for tall and short kids](/guides/special/balance-bikes-for-tall-and-short-kids) covers what to do when the two heights do not overlap.

If no single model covers both, the honest options are two different bikes, or one bike now and the second one when the smaller child grows into it. Buying one bike that fits neither is the option to avoid, and it is the most common outcome of buying as a pair.

## Sharing, when there is only one bike
If the plan is one bike for two children, the rule that works is fixed turns rather than negotiation. A negotiated turn is a turn that gets argued about, and an argued turn is a bike nobody wants to ride by the time it is their go.

Fixed turns work because the exchange point is predictable. Two things make it fail: a turn that ends in the middle of something interesting, and a child who is allowed to keep the bike past their turn because they are "doing well". Both teach that the rule is negotiable.

## The practical costs of two
Two bikes means two of every wear item, and the tyres and bearings wear independently because the children ride differently — [balance bike tyre and wheel care](/guides/maintenance/balance-bike-tyre-and-wheel-care) is the maintenance page that covers what to check on each. It also means two seat heights to maintain, and the common mistake is adjusting both to the taller child and never moving the smaller one back.

Storage is the other cost. Two balance bikes take the floor space of two, and a hallway with two bikes in it is a hallway where neither gets used — which is why [balance bike indoors and in small flats](/guides/scenario/balance-bike-indoors-and-small-spaces) is worth reading before buying the second one.

## When one bike is the better answer
If the children are close in size and the space is small, one correctly sized bike plus a fixed-turn rule beats two badly sized ones. The second bike can come later, and by then the first child's height will tell you what the second one needs to be.

## Extension reading
- [Best balance bike 2026](/guides/best/best-balance-bike-2026)
- [Balance bike maintenance](/guides/maintenance/balance-bike-maintenance)
- [Balance bikes hub](/products/balance-bikes/)`,
    zh: `两个孩子一台车是排班问题；两个孩子两台车是几何问题——而后者常被漏掉。

## 一模一样，还是不一样
直觉是买两台同款，而这只在孩子身材相同时才是正确答案。同年龄的双胞胎经常并不相同：这个年纪差几厘米很常见，而几厘米恰好就是「平脚掌」与「点脚尖」之间的余量。

所以一模一样的这一对，往往意味着一个孩子骑着尺寸正确的车，另一个骑着略不合身的车。骑错台的那个孩子会先失去兴趣，而家长通常把这件事读成「性格」，而不是「合身」。

## 身高差，直接处理
先量两个孩子，分别定出各自需要的座高，再判断是否有单一型号能同时覆盖两者。这是唯一行得通的顺序——[平衡车尺寸对照](/guides/beginner/balance-bike-size-chart)有测量方法，[高矮孩子的平衡车](/guides/special/balance-bikes-for-tall-and-short-kids)讲的是当两个高度并不重叠时该怎么办。

如果没有任何型号能覆盖两者，诚实的选项只有两个：买两台不同的车，或者先买一台、等小的那个长到能骑时再买第二台。要避免的是买一台谁都不合身的车，而这恰恰是「成对购买」最常见的结局。

## 只有一台车时怎么分享
如果计划是一台车给两个孩子，真正有效的规则是固定轮次，而不是协商。协商出来的轮次会被争论，而被争论过的轮次，等到轮到你时这台车已经没人想骑了。

固定轮次有效，是因为交接点可预期。让它失效的也是两件事：在一件有趣的事情进行到一半时结束轮次；以及因为孩子「骑得很好」就允许他超时。两者都在教一件事：规则可以谈。

## 两台车的实际代价
两台车意味着每一个磨损项都是两份，而且轮胎和轴承会各自独立磨损，因为两个孩子骑法不同——[平衡车轮胎与轮组保养](/guides/maintenance/balance-bike-tyre-and-wheel-care)是讲每台该查什么的那一页。它同时也意味着两个座高要维护，而常见错误是把两个都调到高个孩子的位置，之后就再没调回去。

另一项代价是收纳。两台平衡车占两台的地面空间，而一条放着两台车的走廊，会变成两台车都不被使用的走廊——这就是为什么在买第二台之前值得读[平衡车室内与小户型](/guides/scenario/balance-bike-indoors-and-small-spaces)。

## 什么情况下「一台」才是更好的答案
如果两个孩子身材接近、空间又小，一台尺寸正确的车加上固定轮次规则，胜过两台尺寸都不对的车。第二台可以晚些再买，到那时第一个孩子的身高会告诉你第二台该是什么尺寸。

## 延伸阅读
- [2026 最佳平衡车](/guides/best/best-balance-bike-2026)
- [平衡车保养](/guides/maintenance/balance-bike-maintenance)
- [平衡车品类页](/products/balance-bikes/)`,
  },

  // ---- balance / maintenance (1 -> 3) ---------------------------------
  {
    slug: "balance-bike-tyre-and-wheel-care",
    title: "Balance Bike Tyre and Wheel Care",
    description:
      "Tyre types, what each one needs, and how to tell a worn wheel from a damaged one before it becomes a balance problem for the child.",
    keywords: ["balance bike tyres", "balance bike wheels", "balance bike tyre pressure", "balance bike wheel bearings"],
    zhTitle: "平衡车轮胎与轮组保养",
    zhDescription:
      "轮胎类型、各自需要什么维护，以及在「轮子的问题变成孩子的平衡问题」之前，怎么区分磨损与损伤。",
    zhKeywords: ["平衡车轮胎", "平衡车轮组", "平衡车胎压", "平衡车轴承"],
    topic: "maintenance",
    topicOrder: 11,
    cover: `${IMG}/SEREED/Rank_3_ASIN_B0DDQ4FQHK_SEREED%20Toddler%20Balance%20Bike%202%20Year%20Old%20No%20Pedal%20Ki/images/primary.jpg`,
    en: `A balance bike's whole feedback loop runs through its wheels. When they stop being round and free, the child stops being able to balance, and the symptom looks like a skill problem.

## Three tyre types, three care routines
**Pneumatic.** Air-filled, with a valve. These need pressure checked, because a soft pneumatic tyre has a larger contact patch and more rolling drag, which reads to the child as the ground pulling sideways. Check by pressing with a thumb at the top of the wheel, not by looking. The listing or the sidewall carries a recommended pressure; if neither does, inflate until the tyre holds its shape under thumb pressure and no further.

**Foam and EVA.** Solid, no valve, no pressure. Their advantage is that they cannot go flat. Their failure mode is a flat spot: left parked on one spot for a season, the material takes a set and the wheel is no longer round. This cannot be inflated out. It can sometimes be reduced by riding, but a visible flat spot is a wheel that needs replacing.

**Plastic or moulded.** Common on the smallest bikes. They wear rather than deform, and the wear shows as a loss of tread pattern and a shinier surface. On a hard floor an unworn plastic wheel is already the least grippy option, so worn plastic on a hard floor is the case to watch.

## The wheel checks, in order
Spin each wheel with the bike lifted and watch the rim line against the fork. Side-to-side movement is a buckled or badly seated wheel, and the usual cause is an impact rather than wear. Up-and-down movement is a flat spot or a bearing that has collapsed.

Then listen. A wheel that keeps turning and stops smoothly is healthy. One that stops abruptly is dry. One that clicks or grinds has lost a bearing seal, and grit inside a bearing is what turns a cheap wheel into a wheel that has to be replaced rather than serviced.

Finally, check the axle nuts and the wheel-to-fork fit. A wheel that moves in the fork dropouts will steer unpredictably, and this is the one wheel fault that is a safety issue rather than a performance issue.

## What a child feels that the owner misses
A wheel that is slightly out of true still rolls. What it does not do is roll straight, and a child learning balance steers constantly to correct for it. The observable sign is not a wobbly bike but a child who keeps stopping, or who keeps looking down at the front wheel.

That is why the wheel check belongs on a schedule rather than on a symptom. Once a month, with the bike lifted, is enough — [balance bike maintenance](/guides/maintenance/balance-bike-maintenance) has the full routine this fits into.

## When to replace rather than repair
A bearing can be replaced. A foam tyre with a flat spot cannot be corrected, only swapped. A buckled wheel on a bike with spoke wheels can be trued once; a second buckle in the same wheel usually means the rim has taken a permanent set.

If the tyres are being replaced, check the frame at the same time — [balance bike frame and fastener checks](/guides/maintenance/balance-bike-frame-and-fastener-checks) covers what a season of vibration does to the bolts holding those wheels on.

## Extension reading
- [Balance bike frame and fastener checks](/guides/maintenance/balance-bike-frame-and-fastener-checks)
- [Balance bike resale and hand-me-downs](/guides/budget/balance-bike-resale-and-hand-me-downs)
- [Balance bikes hub](/products/balance-bikes/)`,
    zh: `平衡车整套反馈回路都经过轮子。当轮子不再圆、不再顺，孩子就开始站不稳，而这个症状看起来像是「技术问题」。

## 三种胎，三套保养
**充气胎。** 有气门嘴。要查气压，因为偏软的充气胎触地面积更大、滚动阻力更高——孩子读到的是「地面在把车往侧边拽」。检查方法是用拇指按轮子顶部，而不是用眼睛看。商品页或胎侧会写建议气压；两处都没写的，打到「拇指按压下能保持形状」为止，不要更多。

**泡棉与 EVA。** 实心、无气门、无气压。好处是不会爆胎。失效方式是「压平点」：在一个位置停了一整季，材料会定型，轮子就不再是圆的。这个没法靠打气解决。靠骑行有时能减轻，但肉眼可见的压平点就是需要换的轮子。

**塑料或模压。** 多见于最小的车上。它们是被磨掉，而不是被压变形，磨损表现为花纹消失、表面变亮。在硬质地面上，未磨损的塑料轮本来就已经是最不抓地的那一档，所以「磨过的塑料轮 + 硬地面」是最需要留意的组合。

## 轮子检查，按顺序做
把车提起来，拨轮子转，看轮圈对着前叉的那条线。左右摆动，是轮子偏摆或没装正，常见原因是被撞，而不是被磨。上下跳动，是压平点或轴承塌了。

然后听。能持续转动、并且平顺停下的轮子是健康的。突然停住的是干涩。有咔哒声或研磨声的，是轴承失去密封，而轴承里的砂粒正是把「便宜的轮子」变成「必须换掉的轮子」的东西。

最后查轴螺母与轮子和前叉的配合。轮子能在前叉槽里晃动的车，转向会不可预测，而这是唯一属于安全问题、而不只是性能问题的轮子故障。

## 孩子感觉到、而车主忽略的
轻微偏摆的轮子照样能滚，只是滚不直，而正在学平衡的孩子会不停转向去修正它。可观察到的迹象不是「车在晃」，而是孩子反复停下，或者一直低头看前轮。

这正是轮子检查该按日历做、而不是按症状做的原因。每月一次，把车提起来，就够了——[平衡车保养](/guides/maintenance/balance-bike-maintenance)里，这一项就嵌在完整流程中。

## 什么时候该换而不是该修
轴承可以换。带压平点的泡棉胎无法校正，只能换掉。带辐条的车，偏摆的轮子可以校一次；同一个轮子第二次偏摆，通常意味着轮圈已经永久变形。

如果正在换胎，顺便查车架——[平衡车车架与紧固件检查](/guides/maintenance/balance-bike-frame-and-fastener-checks)讲了一季振动会对固定这些轮子的螺栓做什么。

## 延伸阅读
- [平衡车车架与紧固件检查](/guides/maintenance/balance-bike-frame-and-fastener-checks)
- [平衡车转卖与二手](/guides/budget/balance-bike-resale-and-hand-me-downs)
- [平衡车品类页](/products/balance-bikes/)`,
  },
  {
    slug: "balance-bike-frame-and-fastener-checks",
    title: "Balance Bike Frame and Fastener Checks",
    description:
      "The bolts, clamps and joints that a season of vibration works loose, in the order they should be checked, and the two that are safety-critical.",
    keywords: ["balance bike frame check", "balance bike bolts", "balance bike headset", "balance bike safety inspection"],
    zhTitle: "平衡车车架与紧固件检查",
    zhDescription:
      "一季振动会松动的螺栓、夹紧件与接头，按该查的顺序排列，并指出其中两处属于安全关键项。",
    zhKeywords: ["平衡车车架检查", "平衡车螺栓", "平衡车头管", "平衡车安全检查"],
    topic: "maintenance",
    topicOrder: 12,
    cover: `${IMG}/KRIDDO/Rank_Similar_ASIN_B09Z65PBXP_KRIDDO%20Toddler%20Balance%20Bike%202%20Year%20Old%20Age%2024%20Mont/images/primary.jpg`,
    en: `A balance bike has fewer fasteners than a bicycle, which is why the ones it has matter more. Vibration from a hard-wheeled bike on pavement is continuous, and every threaded joint is being slowly asked to come loose.

## Two checks that are safety, not maintenance
**The headset.** Hold the front wheel between your knees and try to turn the handlebars. Any rotation of the bars independent of the wheel is play in the headset. Under load it becomes a front end that steers in two directions at once, and it is the fault most likely to put a child down.

**The stem clamp.** The bolt or bolts that hold the bars to the steerer. A stem that can be twisted by hand with the wheel held still is the same fault at a different joint. On a bike with an adjustable bar height, the clamp is also the thing that lets the bars drop while the child is riding if it is not tight.

Both are checked the same way and both should be checked before every ride, not monthly. Everything below is monthly.

## The monthly list, in order
Start at the wheels and work up, because a fault lower down can imitate one higher up.

**Axle nuts.** A wheel that shifts in the fork dropout makes the bike steer unpredictably. Check that each axle is seated fully and the nut is tight.

**Seat clamp.** With the child's weight on the saddle the clamp takes the load. A quick-release that closes too easily is a clamp that is too loose; it should leave an imprint on your palm.

**Seat post.** On an adjustable bike, the post must not rotate under load. Twist it by hand with the bike held still — a post that turns will turn under a child too.

**Frame joints.** On a welded frame, look at the paint around each weld. A crack in the paint radiating from a weld is the first visible sign of a joint moving, and it is easier to see than the crack itself. On a wooden frame, check the glue lines at the joints instead.

**Every bolt you can reach.** Not to torque them, but to notice which one has moved. Marking bolt heads with a paint pen at assembly turns this into a ten-second visual check rather than a wrench check — a mark that no longer lines up is a bolt that has turned.

## What is not worth checking
Cosmetic scratches, paint wear on the frame, and scuffs on the ends of the grips. None of them affect how the bike rides, and treating them as findings is how a maintenance routine turns into a chore that gets skipped.

The distinction that matters is movement versus appearance. A joint that moves is a joint to tighten or replace. A surface that looks worn is a surface to leave alone.

## Fasteners that cannot be tightened
Some bikes use riveted or press-fit joints that have no fastener to adjust. If one of those develops play, there is no service — the joint is the bike's lifespan. That is worth knowing at purchase, and it is one of the things [a balance bike under 100](/guides/budget/balance-bike-under-100) trades away.

If a fastener keeps coming loose after being tightened twice, the thread or the insert has gone. Tightening it a third time is not a repair; it is a delay.

## Extension reading
- [Balance bike tyre and wheel care](/guides/maintenance/balance-bike-tyre-and-wheel-care)
- [Before the first ride: 5 safety checks](/guides/risk/balance-bike-safety-checks)
- [Balance bikes hub](/products/balance-bikes/)`,
    zh: `平衡车的紧固件比自行车少，所以每一处都更重要。硬轮在铺装路面上的振动是连续的，每一个螺纹接头都在被慢慢地「请求」松脱。

## 两处属于安全、不属于保养
**头管。** 用两膝夹住前轮，试着转动车把。车把相对轮子能独立转动，就是头管旷量。在受力状态下，它会变成一个「同时往两个方向转向」的车头，也是最容易让孩子摔倒的故障。

**把立夹紧。** 把车把固定到竖管上的那一颗或几颗螺栓。轮子固定住之后，车把还能被手拧动，就是同一类故障发生在另一个接头。对于把高可调的车，这个夹紧件同时也是「孩子骑行中车把突然下落」的原因，如果它没拧紧。

两者的检查方法相同，而且都应在每次骑行前查，不是每月查。下面这些才是每月项。

## 每月清单，按顺序
从轮子开始往上走，因为下方的故障会伪装成上方的问题。

**轴螺母。** 轮子能在前叉槽里移动的车，转向不可预测。检查每个轴是否完全就位、螺母是否拧紧。

**座管夹。** 孩子的体重压在座垫上时，夹紧件承受载荷。一扳就轻松合上的快拆，就是太松的夹紧件；它应该在你手掌上留下压痕。

**座管。** 可调车上，座管在受力时不能转动。车固定住，用手扭它——会转的座管，在孩子身下也会转。

**车架接头。** 焊接车架，看每道焊缝周围的漆面。从焊缝向外辐射的漆面裂纹，是「接头在动」最早的可见迹象，而且比裂纹本身更容易看见。木质车架则改为检查接头处的胶线。

**所有够得到的螺栓。** 不是为了逐个上扭矩，而是为了发现哪一颗动过。装配时用漆笔在螺栓头上做记号，这件事就从「拿扳手查」变成「十秒钟看一眼」——记号对不上的，就是转过的螺栓。

## 不值得查的东西
外观划痕、车架漆面磨损、把套末端的擦伤。它们都不影响骑行，而把它们当问题，正是「保养流程沦为会被跳过的杂事」的原因。

真正要分清的是「位移」与「外观」。会动的接头要拧紧或更换；看起来旧的表面，放着不管就好。

## 拧不紧的紧固件
有些车用铆接或压配接头，没有可调的紧固件。这类接头一旦出现旷量，就没有维修——这个接头就是这台车的寿命。这一点在购买时就值得知道，也正是[百元级平衡车](/guides/budget/balance-bike-under-100)让掉的东西之一。

如果一颗螺栓拧紧两次之后仍然松脱，那就是螺纹或嵌件已经坏了。第三次拧紧不是修理，只是拖延。

## 延伸阅读
- [平衡车轮胎与轮组保养](/guides/maintenance/balance-bike-tyre-and-wheel-care)
- [首骑之前：五项安全检查](/guides/risk/balance-bike-safety-checks)
- [平衡车品类页](/products/balance-bikes/)`,
  },

  // ---- balance / best (1 -> 3) ----------------------------------------
  {
    slug: "best-balance-bike-for-2-year-olds",
    title: "Best Balance Bike for a 2-Year-Old",
    description:
      "Why a two-year-old's needs differ from a one-year-old's, and the four listing lines that decide whether a bike fits at exactly this age.",
    keywords: ["best balance bike for 2 year old", "balance bike 2 year old", "toddler balance bike", "2 year old balance bike"],
    zhTitle: "两岁孩子的最佳平衡车：判据在哪",
    zhDescription:
      "两岁孩子的需求与一岁不同在哪里，以及决定「这个年龄到底合不合身」的四行商品页信息。",
    zhKeywords: ["两岁平衡车", "2岁平衡车推荐", "幼儿平衡车", "两岁宝宝平衡车"],
    topic: "best",
    topicOrder: 11,
    cover: `${IMG}/Retrospec/Rank_Similar_ASIN_B0B2H5333D_Retrospec%20Cricket%20Baby%20Balance%20Bike%204-Wheel%20Ride-O/images/primary.jpg`,
    en: `Two is the age where balance bikes stop being walkers and start being vehicles. That shift is what the purchase has to match, and it is why a bike chosen for a one-year-old rarely carries over.

## What changes between one and two
At one, the bike is a seat that moves. The child sits, the feet are on the ground, and forward motion is incidental. At two, the child has usually worked out that pushing off produces speed, and starts lifting both feet to coast. The bike now has to be stable at that moment.

That means three requirements move at once: the seat has to be high enough that the child can push off efficiently and still reach the ground; the bike has to be light enough that the child can control it at speed, not just support it; and the steering has to be predictable, because a two-year-old coasting is steering with their weight rather than their hands.

## The four lines that decide it
**Seat height, as a range.** The child needs flat feet when seated, and the bike needs headroom for a year of growth. [Balance bike size chart](/guides/beginner/balance-bike-size-chart) converts a barefoot inseam into the number. A fixed height is only safe to buy if it matches the child today with a centimetre or two spare.

**Stated maximum rider weight.** An age band of "2-5" spans children whose weights differ substantially. The weight is the line that can be checked, which is why it belongs in the decision and the age band does not.

**Wheel count and wheel size.** Four-wheel bikes are the more forgiving starting point for a child who has just turned two and is still nervous about tipping. Two-wheel bikes are what the child will want once they are coasting. If the budget is one bike, [balance bike vs training wheels](/guides/beginner/balance-bike-vs-training-wheels) explains which transition each shape actually trains.

**Weight.** This is the line most often skipped and the one that decides whether the bike gets used. A bike heavy relative to the child is hard to pick up after a fall, and a two-year-old who cannot recover the bike alone will stop trying — [balance bike weight](/guides/beginner/balance-bike-weight) covers the ratio to aim for.

## What is not a criterion at two
Frame material, brand, and the number of colour options are not deciding factors at this age, because the child cannot perceive any of them. They matter later, when the bike is handed to a second child or resold.

The same goes for "grows with the child" claims that are not backed by a stated seat range. An adjustable bike is adjustable only to the number printed on the post.

## The honest short list
For a child who has just turned two and has not coasted yet: a four-wheel or very stable two-wheel bike, light enough to self-recover, at a seat height the child can flat-foot today. For a child who is already coasting: a two-wheel bike with a stated seat range and a bar height that adjusts, because the bars become the limit before the saddle does.

[A balance bike under 100](/guides/budget/balance-bike-under-100) covers what the lowest band gives up, and [best balance bike 2026](/guides/best/best-balance-bike-2026) is the cross-model comparison. For a child still at the first stage, [best balance bike for a 1-year-old](/guides/beginner/best-balance-bike-for-1-year-old) is the nearer fit.

## Extension reading
- [How to choose a balance bike by age](/guides/beginner/balance-bike-by-age)
- [Best lightweight balance bike](/guides/best/best-lightweight-balance-bike)
- [Balance bikes hub](/products/balance-bikes/)`,
    zh: `两岁是平衡车从「会动的座椅」变成「车」的年龄。购买要匹配的正是这个转变，也正是「一岁时挑的车很少能直接沿用」的原因。

## 一岁到两岁之间变了什么
一岁时，车是一张会移动的座椅：孩子坐着，脚在地上，前进是顺带发生的。两岁时，孩子通常已经弄明白「一蹬就会快」，并开始把双脚抬起来滑行。此时车必须在那一个瞬间是稳的。

这意味着三项要求同时移动：座高要够高，孩子蹬地才有效率，同时仍能触地；车要够轻，孩子在全速时能控制它，而不只是能扶住它；转向要可预测，因为滑行中的两岁孩子是用重心在转向，不是用手。

## 决定成败的四行信息
**座高，以区间给出。** 孩子坐着时要能平脚掌，而车要留出一年的成长余量。[平衡车尺寸对照](/guides/beginner/balance-bike-size-chart)把赤脚内缝换算成这个数字。固定座高只有在「今天刚好合身、并留一两厘米余量」时才值得买。

**标明最大承重。** 「2-5 岁」这个区间里，孩子的体重差异很大。体重是可以对照的那一行，所以它属于决策依据，而年龄段不属于。

**轮子数量与轮径。** 对刚满两岁、还对倾覆不安的孩子，四轮车是更宽容的起点。两轮车则是孩子一旦开始滑行就会想要的形态。如果预算只够一台，[平衡车 vs 训练轮](/guides/beginner/balance-bike-vs-training-wheels)讲的是这两种形态各自训练什么过渡。

**重量。** 这是最常被跳过的一行，也是决定「车会不会被用起来」的一行。相对于孩子偏重的车，摔倒后不好扶起，而一个自己扶不起车的两岁孩子会停止尝试——[平衡车重量](/guides/beginner/balance-bike-weight)讲的是该瞄准的比值。

## 两岁阶段不算判据的东西
车架材质、品牌、颜色选项的数量，在这个年龄都不是决定因素，因为孩子感知不到。它们要到后来才重要——当车交给第二个孩子、或者被转卖的时候。

同样，「随孩子一起长」这类没有标明座高区间支撑的说法，也不算。可调的车，只调到座管上印着的那个数字为止。

## 诚实的短名单
对刚满两岁、还不会滑行的孩子：四轮或非常稳的两轮车，轻到能自己扶起，座高今天是平脚掌够得着的。对已经会滑行的孩子：两轮车，标明座高区间、且把高可调——因为先成为限制的是车把，而不是座垫。

[百元级平衡车](/guides/budget/balance-bike-under-100)讲了最低价位段让掉什么，[2026 最佳平衡车](/guides/best/best-balance-bike-2026)是跨型号对比。如果孩子还在第一阶段，[一岁孩子的最佳平衡车](/guides/beginner/best-balance-bike-for-1-year-old)更贴近。

## 延伸阅读
- [怎么按年龄选平衡车](/guides/beginner/balance-bike-by-age)
- [最佳轻量平衡车](/guides/best/best-lightweight-balance-bike)
- [平衡车品类页](/products/balance-bikes/)`,
  },
  {
    slug: "best-lightweight-balance-bike",
    title: "Best Lightweight Balance Bike",
    description:
      "Weight decides whether a child can recover the bike alone. What the listing publishes, how to read it against the child, and what lightness costs.",
    keywords: ["best lightweight balance bike", "light balance bike", "balance bike weight", "lightest balance bike"],
    zhTitle: "最佳轻量平衡车：重量为什么会决定使用",
    zhDescription:
      "重量决定孩子能否自己扶起车。商品页公布了什么、怎么拿它对照孩子，以及「轻」要付出什么代价。",
    zhKeywords: ["轻量平衡车", "最轻平衡车", "平衡车重量", "轻便平衡车"],
    topic: "best",
    topicOrder: 12,
    cover: `${IMG}/Gotrax/Rank_12_ASIN_B0FVRV5HZB_Gotrax%20Baby%20Balance%20Bike%201-2%20Years%207%20FrontRear%20Sil/images/primary.jpg`,
    en: `Lightness is the most-quoted balance bike attribute and the least usefully quoted. A number on a listing means nothing until it is compared to the child who has to pick the bike up.

## Why weight decides usage more than any spec
Every balance bike session contains a moment where the bike falls. What happens next decides whether the child keeps riding. A child who can lift the bike back upright themselves will do it and carry on. A child who cannot will look for an adult, and after a few of those the bike becomes something that only works when someone is watching.

That is why the useful comparison is not the bike's weight but the bike's weight against the child's. [Balance bike weight](/guides/beginner/balance-bike-weight) covers the ratio to aim for; the short version is that a bike a child can lift comfortably is a bike they will ride unsupervised in a garden.

## What the listing actually publishes
Most balance bike listings state a weight, and the number is usually the bike without anything added. Three things make that number mean less than it appears:

**It may exclude the parts that ship detached.** Bars, saddle and wheels often arrive unbolted. The assembled weight is the one that matters.

**It says nothing about the distribution.** A bike that is light overall but carries its mass high is harder to lift off the ground than a slightly heavier bike with a lower centre. This is also why [balance bike stability](/balance-bike-stability/) is about geometry rather than mass.

**It is not comparable across materials without the frame size.** Wood, steel and aluminium frames at the same seat height do differ, but the catalogue's lightest option at one seat height may be the heaviest at another.

## What lightness costs
At a given price, saving weight usually comes out of one of three places: thinner tubing, fewer adjustment mechanisms, or smaller wheels. Each has a consequence.

Thinner tubing flexes, which is fine in a frame designed for it and a problem in one that is not. Fewer adjustments keeps the weight and the price down but reduces how long the bike fits — [balance bikes for tall and short kids](/guides/special/balance-bikes-for-tall-and-short-kids) is where that trade gets decided. Smaller wheels are lighter and also the least able to roll over a kerb, which matters more as the child gets faster.

The one saving that is not worth taking is a hollow or thin-walled frame with a stated maximum weight that the child is already close to. Lightness should come out of geometry design, not out of material margin.

## How to judge it in a shop
Lift the bike by the handlebars with one hand. If it comes up easily and hangs level, the mass is reasonably low. If it hangs nose-down or tail-down, the distribution is uneven, and the child will feel that as the bike wanting to fall in one direction.

Then pick it up the way a child would — by the frame or the saddle, not by the bars — and see whether it can be righted one-handed. That is the actual skill the weight has to support.

## Where this sits in the short list
For a child at the coasting stage, weight and geometry together are the two criteria that decide the purchase, and [best balance bike for a 2-year-old](/guides/best/best-balance-bike-for-2-year-olds) is the age-specific version. [Best balance bike 2026](/guides/best/best-balance-bike-2026) is the cross-model view, and [a balance bike under 100](/guides/budget/balance-bike-under-100) covers what the lowest band trades for its price.

## Extension reading
- [Balance bike weight: why it matters](/guides/beginner/balance-bike-weight)
- [Balance bike frame and fastener checks](/guides/maintenance/balance-bike-frame-and-fastener-checks)
- [Balance bikes hub](/products/balance-bikes/)`,
    zh: `「轻」是被引用最多、也最没被引用清楚的平衡车属性。商品页上的一个数字，在拿去对照那个要扶起车的孩子之前，没有任何意义。

## 为什么重量比任何参数都更能决定「会不会被用」
每一次平衡车活动里，都有车倒下的那一刻。接下来发生什么，决定孩子还骑不骑。自己能扶正车的孩子会扶起来继续；扶不动的孩子会去找大人，而这样几次之后，车就变成「有人在看时才成立」的东西。

这就是为什么有用的对照不是车的重量，而是车重相对孩子的重量。[平衡车重量](/guides/beginner/balance-bike-weight)讲的是该瞄准的比值；简版是：孩子能轻松抬起的车，才是他会在院子里自己骑的车。

## 商品页到底公布了什么
多数平衡车页面会写重量，而那个数字通常是「什么都不加」的车。三件事让它没有看上去那么有用：

**它可能不含出厂时未安装的部件。** 车把、座垫、轮子经常是散件发运。真正相关的是装配后的重量。

**它不含重心分布信息。** 整体轻、但把质量带在高处的车，比一辆略重、重心更低的车更难从地上扶起来。这也正是为什么[平衡车稳定性](/balance-bike-stability/)讲的是几何而不是质量。

**没有车架尺寸，跨材质并不能直接比较。** 木质、钢、铝在相同座高上确实有差别，但目录里在某个座高上最轻的选项，在另一个座高上可能是最重的。

## 「轻」要付出什么
在给定价格上，减重通常来自三处之一：更薄的管壁、更少的可调机构、或更小的轮子。每一种都有后果。

更薄的管壁会形变，在设计上允许形变的车架里没问题，在设计上不允许的车架里就是问题。更少可调性降低了重量与价格，但也缩短了合身时长——[高矮孩子的平衡车](/guides/special/balance-bikes-for-tall-and-short-kids)正是决定这个取舍的地方。更小的轮子更轻，同时也最不擅长滚过路缘石，而孩子越快，这一点越重要。

唯一不值得的省法是：薄壁或空心车架，配上孩子已经接近的标明最大承重。轻应当来自几何设计，而不是来自材料余量的削减。

## 在店里怎么判断
单手抓车把把车提起来。轻松提起、并保持水平悬挂的，质量分布还算低。如果车头或车尾明显下垂，分布不均，而孩子会把这件事感觉成「车想往一边倒」。

然后按孩子的方式提起它——抓车架或座垫，不是抓车把——看能不能单手扶正。那才是重量真正需要支撑的那个动作。

## 它在短名单里的位置
对已经会滑行的孩子，重量与几何共同构成决定购买的两条判据，[两岁孩子的最佳平衡车](/guides/best/best-balance-bike-for-2-year-olds)是年龄更具体的版本。[2026 最佳平衡车](/guides/best/best-balance-bike-2026)是跨型号视角，[百元级平衡车](/guides/budget/balance-bike-under-100)讲了最低价位段为价格让掉了什么。

## 延伸阅读
- [平衡车重量：为什么重要](/guides/beginner/balance-bike-weight)
- [平衡车车架与紧固件检查](/guides/maintenance/balance-bike-frame-and-fastener-checks)
- [平衡车品类页](/products/balance-bikes/)`,
  },
];

/* ------------------------------------------------------------------ */

async function main() {
  // The token gates WRITES only. `GET /api/cms/guides` is public (verified: 200
  // without a token), and `POST /api/cms/guides/save` is 403 without one, so a
  // dry run — the whole point of which is to be safe to run anywhere — must not
  // be blocked by a credential it never uses.
  if (!TOKEN && APPLY) {
    console.error("CMS_ADMIN_ALL_TOKEN is required for --apply (POST /api/cms/guides/save returns 403 without it).");
    process.exit(1);
  }

  const payload = await request(API_BASE, `/api/cms/guides?cb=${Date.now()}`);
  const records = unwrap(payload);
  if (!records) { console.error("Unexpected CMS response shape"); process.exit(1); }

  // The counts below are computed over the LIVE published set the prerender
  // actually renders. `balance-bike-stability` is published in the CMS but
  // RETIRED (301 to the asset page), and the prerender drops it before counting
  // anything — counting raw CMS rows would overstate scenario by one and ship a
  // batch that leaves the combination below the threshold.
  const RETIRED = new Set(["balance-bike-stability"]);
  const published = records.filter((r) => String(r.status || "published") === "published");
  const livePublished = published.filter((r) => !RETIRED.has(r.slug));
  const bySlug = new Map(published.map((r) => [r.slug, r]));
  const publishedSlugs = new Set(livePublished.map((r) => r.slug));
  const topicBySlug = new Map(
    livePublished.map((r) => [r.slug, String(r.taxonomy?.topicCategory || r.category || "").trim()]),
  );
  console.log(`CMS guides: ${records.length} total, ${published.length} published, ${livePublished.length} live (retired excluded)`);

  if (VERIFY) {
    let bad = 0;
    for (const a of ARTICLES) {
      const r = bySlug.get(a.slug);
      if (!r) { console.error(`[MISSING] ${a.slug}`); bad++; continue; }
      const okEn = String(r.en?.content || "").includes("##");
      const okZh = String(r.zh?.content || "").includes("##");
      const okTax = r.taxonomy?.productCategory === PRODUCT_CATEGORY && r.taxonomy?.topicCategory === a.topic;
      const okSeo = Boolean(r.seo?.en?.title && r.seo?.zh?.title);
      if (!(okEn && okZh && okTax && okSeo)) {
        console.error(`[FAIL] ${a.slug} en=${okEn} zh=${okZh} tax=${okTax} seo=${okSeo}`); bad++;
      } else {
        console.log(`[ok] ${a.slug}  en=${wordCount(r.en.content)}w zh=${String(r.zh.content).length}c`);
      }
    }

    const counts = new Map();
    const liveAfter = published.filter((r) => !RETIRED.has(r.slug));
    for (const r of liveAfter) {
      const k = `${r.taxonomy?.productCategory}/${r.taxonomy?.topicCategory}`;
      counts.set(k, (counts.get(k) || 0) + 1);
    }
    console.log(`\n${PRODUCT_CATEGORY} combinations after fill:`);
    for (const t of ["beginner", "scenario", "budget", "risk", "special", "maintenance", "best"]) {
      const n = counts.get(`${PRODUCT_CATEGORY}/${t}`) || 0;
      console.log(`  ${t.padEnd(14)} ${n}  ${n >= 3 ? "indexable" : "STILL BELOW 3"}`);
    }
    process.exit(bad ? 1 : 0);
  }

  // Cover budget: count how many LIVE guides already use each cover, so the
  // batch cannot push any one image to three sharers (check:covers fails at 3).
  const coverUse = new Map();
  for (const r of livePublished) {
    const k = coverKey(r.imageUrl);
    if (k) coverUse.set(k, (coverUse.get(k) || 0) + 1);
  }

  // Body copy links to prerendered asset pages (/balance-bike-stability/,
  // /products/balance-bikes/), which no CMS fetch can prove exist. Read the
  // build when it is there; report the gap when it is not, rather than passing
  // those links silently.
  const knownRoutes = collectKnownRoutes(join(process.cwd(), "dist"));
  if (knownRoutes) {
    console.log(`route check: ${knownRoutes.size} prerendered routes read from dist`);
  } else {
    const unchecked = new Set(ARTICLES.flatMap((a) => [...nonGuideTargets(a)]));
    console.log(`route check: dist absent — ${unchecked.size} non-guides link target(s) NOT verified:`);
    for (const t of unchecked) console.log(`  ? ${t}`);
  }

  const problems = assertCopy(ARTICLES, {
    publishedSlugs,
    topicBySlug,
    coverUse,
    productCategory: PRODUCT_CATEGORY,
    knownRoutes,
  });
  if (problems.length) {
    console.error(`Refusing to write — ${problems.length} copy problem(s):`);
    for (const p of problems.slice(0, 40)) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log(`copy self-check OK — ${ARTICLES.length} articles, grounded, covers within budget, all links resolve`);

  const planned = [];
  for (const a of ARTICLES) {
    if (publishedSlugs.has(a.slug)) { console.log(`[skip] ${a.slug} — already published`); continue; }
    const rec = buildRecord(a, PRODUCT_CATEGORY);
    planned.push({ slug: a.slug, rec });
    console.log(`[plan] ${a.slug.padEnd(44)} ${PRODUCT_CATEGORY}/${a.topic}  en=${wordCount(a.en)}w zh=${a.zh.length}c`);
  }

  if (!planned.length) { console.log(`Nothing to do — all ${ARTICLES.length} already exist.`); return; }

  if (EMIT_SQL) {
    const outDir = join(process.cwd(), ".workbuddy", "tmp", `guides-fill-${BATCH_LABEL}`);
    const { sqlFile, recordsFile, bytes } = emitSql({
      planned,
      outDir,
      label: BATCH_LABEL,
      header: [
        `R48 batch 2: ${ARTICLES.length} balance guides, taking every balance combination to >=3.`,
        `Generated by scripts/fill-guides-balance-gaps.mjs --sql.`,
        `Apply: wrangler d1 execute my_d1_j13_binder --remote --file <this file>`,
      ],
    });
    console.log(`wrote ${sqlFile}  (${planned.length} INSERT, ${bytes} bytes)`);
    console.log(`wrote ${recordsFile} (same payloads, for --verify cross-check)`);
    return;
  }

  if (!APPLY) { console.log(`\nDry run: ${planned.length} record(s) would be created. Re-run with --apply.`); return; }

  const backupDir = join(process.cwd(), ".workbuddy", "tmp", `guides-fill-${BATCH_LABEL}`);
  mkdirSync(backupDir, { recursive: true });
  const backupFile = join(backupDir, `created-${Date.now()}.json`);
  writeFileSync(backupFile, JSON.stringify(planned.map((p) => p.rec), null, 2));
  console.log(`backup of created records: ${backupFile}`);

  let ok = 0;
  for (const { slug, rec } of planned) {
    const saved = await request(API_BASE, "/api/cms/guides/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rec),
    });
    if (!saved?.data?.saved) {
      console.error(`[FAIL] ${slug}: ${JSON.stringify(saved).slice(0, 200)}`);
      process.exitCode = 1;
    } else { ok++; console.log(`[ok] ${slug}`); }
  }
  console.log(`\nCreated ${ok}/${planned.length} guide(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});