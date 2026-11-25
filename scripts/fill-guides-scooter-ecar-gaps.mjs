/**
 * R48 — fill the guides category x topic gaps, batch 4: scooter + electric_car.
 *
 * WHY THESE TWO TOGETHER. Both categories are the last two on the axis, and
 * both sit almost entirely below COMPOSITE_INDEX_THRESHOLD (3): every
 * /guides/<cat>/<topic>/ page exists, is linked, and carries noindex,follow.
 * Taking them in one batch keeps the shared driver, the route read and the
 * cover budget in one process.
 *
 * WHERE THE 14 ARTICLES COME FROM — this batch is keyword-led, not gap-led
 * alone. The article set was chosen from the 2026-11 live English SERP for both
 * categories (five sources each, read on 2026-11-25) and then checked against
 * what the 22 published articles in these two categories already say. The
 * measured result, per cluster:
 *
 *   cluster                        scooter   electric_car
 *   holiday / gift / Black Friday     0/10        0/12   <- peak this week
 *   assembly before gifting           0/10        0/12
 *   3-wheel + lean-to-steer first     2/10         n/a
 *   two-wheel transition around 6-8   0/10         n/a
 *   handlebar height / growth         2/10         n/a
 *   brake reach for small hands       0/10         n/a
 *   riding surface / terrain          0/10        0/12
 *   12V vs 24V explained               n/a        1/12
 *   soft-start / speed lockout        0/10        4/12
 *   wheel and tyre wear               1/10        0/12
 *
 * The zero-coverage clusters are the ones this batch writes to. The holiday
 * cluster is the sharpest: five 2026 gift guides lead with it, the site has not
 * one sentence on it in either category, and Black Friday falls on 2026-11-28.
 * That is why the set is shaped around preparation and fit questions rather
 * than around another round of "best of" pages, of which there are already five.
 *
 * WHY SCOOTER GETS FIVE AND ELECTRIC_CAR NINE. Not editorial choice — cover
 * supply. check:covers refuses a third sharer of any one image, and the scooter
 * catalogue carries 13 products of which six are ADULT electric scooters, whose
 * photos cannot illustrate a children's scooter. That leaves seven usable
 * products, five of which already carry two guides. Five articles is the whole
 * remaining scooter cover budget, and this batch spends all of it. Filling
 * scooter's other four combinations needs more children's scooter photos first;
 * see the note at the end of this header.
 *
 * WHAT THAT BUYS. electric_car goes from 5 indexable... to 7 of 7 combinations
 * at 3+. Scooter flips three: beginner, risk and best reach 3, while scenario,
 * budget and maintenance stop at 2 and stay noindex. That is the honest
 * outcome of a five-article budget, and it is stated here rather than discovered
 * later from a composite page that never earned an index entry.
 *
 * GROUNDING RULE (unchanged across every batch). The site is an editorial
 * publisher with no laboratory, so this copy states no third-party figure, no
 * model weight, no price, no certification claim, and no first-person
 * measurement. It argues from published-document structure instead: which
 * question a listing answers, which line on a spec sheet is the one that
 * matters, what a voltage number does and does not promise. The vocabulary is
 * enforced by assertCopy() in lib/guide-batch.mjs.
 *
 * CONTRACT. Creates 14 NEW records, never edits an existing one, refuses to run
 * if a slug already exists, idempotent on re-run. Every check lives in
 * lib/guide-batch.mjs.
 *
 * Usage:
 *   node scripts/fill-guides-scooter-ecar-gaps.mjs              # dry run
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/fill-guides-scooter-ecar-gaps.mjs --apply
 *   node scripts/fill-guides-scooter-ecar-gaps.mjs --sql        # emit a D1 .sql file
 *   node scripts/fill-guides-scooter-ecar-gaps.mjs --verify     # re-fetch and assert
 */
import { runBatch } from "./lib/guide-batch.mjs";

const APPLY = process.argv.includes("--apply");
const VERIFY = process.argv.includes("--verify");
const EMIT_SQL = process.argv.includes("--sql");
const API_BASE = (process.env.CMS_API_BASE || "https://store.balancebiketoddler.com").replace(/\/+$/, "");
const TOKEN = String(process.env.CMS_ADMIN_ALL_TOKEN || "").trim();

// Two categories in one process: the driver takes one productCategory per call,
// so this file runs it twice. The articles are split by category rather than
// flagged, because a record's productCategory decides its URL and a batch that
// could write either one would eventually write the wrong one.
const BATCH_LABEL = "b4-scooter-ecar";

const ECAR_ARTICLES = [
  // ---- electric_car / beginner (1 -> 3) --------------------------------
  {
    slug: "kids-ride-on-first-car-toddler",
    title: "A First Ride-On Car for a Toddler",
    description:
      "A first ride-on is a seat, a low speed and an adult holding the remote. What to look at on the box before it gets opened.",
    keywords: ["first ride on car", "ride on car for 1 year old", "toddler ride on car", "ride on car parental remote"],
    zhTitle: "幼儿第一辆电动车：先看座、看速度、看遥控",
    zhDescription:
      "第一辆电动车不是缩小版的汽车，而是带轮子的座椅加一个掌握遥控的大人。拆箱之前该确认的三件事。",
    zhKeywords: ["幼儿电动车", "第一辆电动车", "一岁电动车", "电动车遥控"],
    topic: "beginner",
    topicOrder: 51,
    cover: "https://store.balancebiketoddler.com/electric_vehicles/Gotrax/Rank_Similar_ASIN_B0FCC24ZQC_Gotrax%20WG1%20Electric%20Wiggle%20Car%20for%20Kids%2012V%20Big%20Ba/images/primary.jpg",
    en: `A ride-on car for a child under three is not a small car. It is a seat with wheels, a motor, and an adult holding a remote. Read the box as though those four things were the entire specification, because for this age they are.

## The seat decides more than the motor does
The first question is not how fast it goes. It is whether the child can sit in it without sliding, slumping, or dragging a foot on the ground.

A seat with a back and a strap holds a toddler upright. A flat bench does not, and a child who is constantly correcting their posture is not steering. Look at the depth of the seat against the child's thigh: a seat deep enough to support the whole thigh keeps the child from sliding forward every time the car stops. A shallow seat turns each stop into a slide.

If the child cannot stay seated while the car is moving, nothing the motor does will help.

## Speed is a setting, not a number to maximise
Every car in this tier offers at least two speeds, and most offer a lockout that holds the car to the lower one. That lockout is the specification that matters for a first car, not the top speed printed on the side of the box.

A walking-paced top speed is enough to make the toy interesting and slow enough for a small child to notice what is happening. The higher setting is something the car grows into. A child who has never steered anything does not need a second speed available on the first afternoon.

## The remote is the parent's brake
A parental remote does two jobs that are easy to confuse. It can steer, and it can stop. For a first car, the second is the one that earns its place. A button that brings the car to a halt from a distance is what lets an adult stand beside the child rather than chase behind them.

Two practical checks before the first drive. Confirm the remote is paired and that the car actually responds to it with the child aboard, not just on the bench. Then agree with the child which of you is driving. A toddler who believes they are in charge will fight the remote, and that tug-of-war is the thing most likely to end the first session early.

## What to ignore on the box
Sticker count, engine sounds, and the number of licensed badges are decoration. Music players and working headlights are pleasant and irrelevant. None of them changes whether the child fits, whether the speed is manageable, or whether an adult can stop the car.

The one decorative feature worth a second look is anything that invites a child to stand up, climb, or lean out while the car is moving. Those are the parts that turn a seated toy into a fall.

## When it stops being the right toy
A child outgrows a first ride-on when their knees no longer clear the dashboard, when they start reaching for the wheel rather than the seat, and when the lower speed stops being interesting. Those are the signals to look at a larger car, not the age printed on the box.

Until then, the useful measure of a first car is simple: the child sits, the car moves slowly, and an adult can stop it from where they are standing.
`,
    zh: `给三岁以下孩子的电动车，不是一辆缩小的汽车。它是一把带轮子的座椅、一个电机，和一个握着遥控器的大人。看包装的时候，就把这四样当成全部规格——对这个年龄来说，它们确实是全部。

## 座椅比电机更决定成败
第一个问题不是它能跑多快，而是孩子能不能坐住——不会往前滑、不会往下瘫、不会把一只脚蹭到地上。

有靠背和固定带的座椅能把幼儿撑住；一块平的坐板不能。一个一直在调整姿势的孩子，是腾不出手来转向的。再看座深和孩子大腿长度的关系：座够深，能托住整条大腿，车一停孩子就不会往前冲；座太浅，每一次停车都是一次下滑。

如果车在动的时候孩子坐不住，电机再好也帮不上忙。

## 速度是一个档位，不是一个要拉满的数字
这个价位段的车，基本都有至少两个档，多数还有一个把车锁在低档的功能。对第一辆车来说，那个「锁定」才是关键规格，而不是印在箱子侧面的最高速度。

步行速度的上限，已经足够让玩具变得有意思，又慢到孩子能看清发生了什么。高档是车以后要长进去的东西。一个从来没操控过任何东西的孩子，不需要在第一个下午就拥有第二个档位。

## 遥控器是大人的刹车
遥控器做两件事，很容易被混为一谈：它能把方向，也能把车停下来。放在第一辆车上，第二件事才是它存在的理由。一个能让车从远处停住的按钮，意味着大人可以站在孩子旁边，而不是在后面追。

出发前有两个实际检查。一是确认遥控器已经配对，并且是孩子坐在车上时车真的会响应，而不只是在空车上试。二是在出发前和孩子说清楚：这一趟是谁在开。认为自己才是司机的幼儿一定会跟遥控器较劲，而那场拉扯，通常是第一次玩提前结束的原因。

## 包装上可以忽略的东西
贴纸数量、引擎音效、授权标志的数量，都是装饰。音乐播放和会亮的车灯是加分项，但和「该不该买」无关。它们既不影响孩子坐不坐得下，也不影响速度是否可控，更不影响大人能不能把车停下。

唯一值得再看一眼的「装饰」，是任何鼓励孩子站起来、往上爬、或者车在走的时候往外探的设计。那才是把一个坐着玩的玩具，变成一次摔倒的部分。

## 什么时候它就不是合适的玩具了
当孩子的膝盖顶到仪表台、当他们开始伸手去够方向盘而不是扶着座椅、当低档已经提不起兴趣的时候，就是该看更大一辆车的时候了，而不是看箱子上的年龄。

在那之前，衡量一辆第一辆车好不好用的标准很简单：孩子坐得住，车走得慢，大人站在原地看着就能把它停下。
`,
  },
  {
    slug: "kids-ride-on-6v-12v-24v",
    title: "6V, 12V and 24V Ride-Ons: What Differs",
    description:
      "The voltage on the box describes a battery pack, not a child. What each tier changes about speed, terrain and run time.",
    keywords: ["6v 12v 24v ride on", "ride on car voltage", "what does 24v mean ride on", "ride on battery voltage"],
    zhTitle: "6V、12V、24V 电动车：差别到底在哪",
    zhDescription:
      "包装上的电压说的是电池组，不是孩子。每一档真正改变的是速度、地形适应和能跑多久。",
    zhKeywords: ["电动车电压", "6V 12V 24V 区别", "24V 电动车", "儿童电动车电池"],
    topic: "beginner",
    topicOrder: 52,
    cover: "https://store.balancebiketoddler.com/electric_vehicles/First/Rank_Similar_ASIN_B0DB4WXZ36_First%20Ride%20On%20Ford%20Bronco%2024V%20Ride%20on%20Toys%20for%20Boy/images/primary.jpg",
    en: `Voltage is the most quoted number on a ride-on box and the least understood. It describes a battery pack. It does not describe a child, a child's age, or how much fun the toy is. What it does describe is how much work the motor can be asked to do before the pack runs down, and that has three visible consequences.

## The three tiers, in plain terms
A 6V car is a small, light vehicle with a short run time and a gentle top speed. It suits a flat, smooth surface and a child who is still learning that pressing the pedal makes the car move.

A 12V car is the middle of the market. It usually carries a slightly larger motor, a longer run time, and enough torque to move on grass as well as pavement, at a walking to slow-jogging pace.

A 24V car is the larger end. The extra voltage buys torque more than it buys speed: it is what lets a heavier car with two seats and two children climb a gentle slope or cross a lawn without stalling.

## What voltage does not tell you
It does not tell you the top speed. Two cars of the same voltage can ship with different gearing and different speed settings, so the voltage is a weak predictor of how fast a particular model goes.

It does not tell you the run time either. Run time depends on the pack's capacity, the weight it is moving, and the surface. A large 24V car on grass can run down sooner than a small 12V car on a smooth driveway.

And it says nothing about safety features. A 24V car can have a lockout, a soft start and a remote; a 6V car can have none of them. Those are separate decisions, made by the maker, and they matter more for a young child than the voltage does.

## Read the voltage against the terrain
The useful question is not which voltage is better but which voltage suits the ground the car will actually be used on.

A flat driveway or a paved patio asks very little of the motor. A 6V or 12V car handles it. Grass is a different problem: it is soft, it is uneven, and a wheel has to push through it rather than roll across it. That is where the higher tiers earn their price. If the family garden is the main venue, the lower tier will spend its life stalling at the first patch of longer grass.

Slopes are the same story with weight added. A gentle slope plus two children plus a 24V pack is a reasonable combination. The same slope with a 12V car and two children is a car that stops halfway up.

## Match the voltage to the child's stage
A child in their second or third year does not need torque. They need a low top speed and an adult who can stop the car, and both of those are available in the smallest tier.

Torque becomes relevant when the child is driving themselves over ground that resists, which in practice means an older and heavier child, often in a garden rather than on a driveway. That is also the point at which the higher tier starts to make sense.

## The short version
Voltage is a capability rating for the battery and motor, not a ranking. Choose the smallest tier that can move the child over the surface the car will really be used on, then spend the remaining attention on the seat, the speed settings and the remote.
`,
    zh: `电压是电动车包装上被引用最多、也最容易被误解的数字。它描述的是电池组。它不描述一个孩子、不描述孩子的年龄，也不描述这玩具好不好玩。它真正描述的，是电池用完之前电机能被要求做多少功——而这一点会带来三个看得见的后果。

## 三档，用大白话说
6V 是一辆又小又轻的车，续航短，最高速度温和。它适合平整光滑的地面，以及一个还在学习「踩下去车就会走」这件事的孩子。

12V 是市场的中段。通常配稍大的电机、更长的续航，以及足以在草地和人行道上都跑起来的扭矩，速度大致从步行到慢跑。

24V 是更大的一端。多出来的电压买到的更多是扭矩而不是速度：它让一辆更重、带两个座位、坐着两个孩子的车，能够爬上缓坡或者穿过草坪而不熄火。

## 电压不能告诉你的事
它不能告诉你最高速度。同样电压的两辆车，可以配不同的齿比和不同的限速设置，所以电压对「这台车能跑多快」是很弱的预测指标。

它也不能告诉你续航。续航取决于电池容量、它要推动的重量，以及地面。一辆大 24V 车在草地上，可能比一辆小 12V 车在平整车道上更早没电。

它更不说明任何安全配置。一辆 24V 车可以有锁定档、软启动和遥控；一辆 6V 车也可以三样全无。那些是厂商另外做的决定，而对年幼的孩子来说，它们比电压更重要。

## 拿电压去对照地面
有用的问题不是「哪一档更好」，而是「哪一档适合这辆车真会被开去的地面」。

平整的车道或者铺好的露台，对电机要求很低，6V 或 12V 都应付得来。草地是另一个问题：它软、不平，轮子得「挤」过去而不是「滚」过去。高档位就是在这里值回价钱。如果家里的花园才是主场地，低档位的一生都会在「遇到第一片长一点的草就停住」里度过。

坡道是同一件事再加上重量。缓坡 + 两个孩子 + 24V，是合理的组合。同样的缓坡 + 12V + 两个孩子，就是一辆爬到一半停下的车。

## 把电压对上孩子的阶段
两三岁的孩子不需要扭矩。他们需要的是低的最高速度，和一个能把车停下来的大人——这两样在最小的那一档里都有。

扭矩开始变得相关，是当孩子自己把车开上「会抵抗」的地面时；实际情形通常是更大更重的孩子，场地往往也是花园而不是车道。那也正是高档位开始说得通的时刻。

## 一句话版本
电压是电池和电机的能力评级，不是排名。选「刚好能把孩子送过那片真会去的地面」的最小一档，然后把剩下的注意力花在座椅、限速档和遥控上。
`,
  },

  // ---- electric_car / scenario (2 -> 3) --------------------------------
  {
    slug: "kids-ride-on-gift-prep",
    title: "A Ride-On as a Gift: What to Do First",
    description:
      "Assembly, the first charge, and where the box lives until the morning. The hour of preparation that decides whether the gift works.",
    keywords: ["ride on car gift", "ride on car assembly", "ride on car first charge", "christmas ride on car"],
    zhTitle: "把电动车当礼物：拆箱前要先做的几件事",
    zhDescription:
      "组装、首次充电、箱子藏哪儿。礼物当天能不能用，往往取决于事前这一小时。",
    zhKeywords: ["电动车礼物", "电动车组装", "电动车首次充电", "圣诞电动车"],
    topic: "scenario",
    topicOrder: 51,
    cover: "https://store.balancebiketoddler.com/electric_vehicles/Best/Rank_Similar_ASIN_B0CPB1GVGJ_Best%20Choice%20Products%2012V%20Licensed%20Chevrolet%20Silver/images/primary.jpg",
    en: `A ride-on car is one of the few gifts that can fail on the morning it is given, not because it is wrong but because it is not ready. The box is large, the assembly is real, and the battery arrives partly charged at best. Every one of those is solvable in advance, and none of them is solvable at seven in the morning with a child watching.

## Assemble it before, not during
Most ride-ons ship in pieces: wheels, handlebars or steering column, seat, and sometimes mirrors or a windscreen. The instructions are usually adequate and the assembly usually takes under an hour, but it does take an hour, and it needs a clear floor.

Do it in advance, out of sight, and then check the parts that are easiest to get wrong. Wheels should sit flush and turn freely. The steering should move the front axle through its full range without binding. Every fastener that holds a wheel or the steering column should be tight, because those are the ones that matter while the car is moving.

Keep the instructions and the small parts bag. A missing fastener discovered in January is much easier to solve with both in hand.

## Give the battery its first proper charge
A new pack is shipped part-charged for storage, not for play. The manual states how long the first full charge should be, and it is longer than a normal top-up. Doing it the night before means the car is ready when it is unwrapped rather than an hour after.

Charge it where you can see it, on a surface that is not carpet, and unplug it when the stated time is up. This is a routine, not a precaution to be argued about: it is the same routine the manual describes for every subsequent charge.

## Decide the first venue before the first ride
The car's first drive will set the pattern. A flat, smooth, enclosed space, with an adult standing beside it and the lockout engaged, is a far better opening than an open garden with a slope. If the venue is a garden, walk it first and note where the ground dips, where it meets a wall, and where a child could reach a road.

This is also the moment to decide who holds the remote for the first few sessions. Two adults each with a hand on the controls is a worse arrangement than one adult with the remote and one keeping other children clear.

## The parts of the gift that are not the car
A helmet is worth thinking about before the first ride rather than after. So is where the car will be stored: a ride-on that lives outdoors in the rain ages quickly, and one that lives in a hallway gets used far more often than one that lives in a shed.

If the gift is going to a household with more than one child, work out the turn-taking before the morning. The car has one seat, or two, and the queue is the thing most likely to turn a good gift into a bad afternoon.

## What to tell the child, not just the buyer
The child who receives the car should know two things before they sit in it: how to make it stop, and that an adult is the one who decides where it goes for the first while. Both are easier to say in advance than to introduce mid-drive.

An hour of preparation covers all of it. The alternative is discovering the same four problems in sequence, with an audience.
`,
    zh: `电动车是少数「会在送出的那个早上失败」的礼物之一。失败的原因往往不是选错了，而是没准备好。箱子很大，组装是真要动手的，而电池到手时最多只是半电。这三件事每一件都能提前解决，而每一件都不能在早上七点、孩子盯着你的时候解决。

## 提前组装，不要当天装
多数电动车是散件装箱的：轮子、车把或转向柱、座椅，有时还有后视镜和挡风。说明书通常够用，组装通常一小时内能完成——但它确实要一个小时，而且需要一块干净的地面。

提前做，藏起来做，然后检查最容易装错的那几处。轮子应该贴合、转动顺畅。转向应该能让前轴走完全程而不发卡。所有固定轮子和转向柱的紧固件都要拧紧，因为车在动的时候，起作用的正是它们。

说明书和小零件袋都留着。一月份发现少一颗螺丝的时候，手上有没有这两样东西，差别很大。

## 首次充电要认真充一次
新电池是为存放而半电出货的，不是为玩。说明书会写首次充满需要多久，那个时间比日常补电更长。提前一晚插上，第二天拆箱时车就能用，而不是拆完再等一小时。

在看得见的地方充，别放在地毯上，到时间就拔。这是一套流程，不是一个可以商量的注意事项——它和说明书里写的每一次充电流程是同一套。

## 先定第一次在哪里开
第一次开会在孩子心里定下模式。一块平整、光滑、围合的空间，一个大人在旁边站着，限速档开着，比一片开阔、还带斜坡的花园要好得多。如果场地就是花园，先自己走一遍，记住哪里地面下沉、哪里靠墙、哪里能通向马路。

这也是决定「前几次谁拿遥控」的时刻。两个大人各伸一只手去碰控制，比「一个大人拿遥控、另一个大人负责把其他孩子带开」要糟得多。

## 不属于车本身的那几件事
头盔值得在第一次骑之前想好，而不是之后。存放位置也一样：长期放在露天淋雨的电动车老得很快，而放在玄关的车，被用到的次数远多于放在棚子里的车。

如果礼物送去的是有多个孩子的家庭，在早上之前就把轮流的顺序定下来。车只有一个座位，或者两个，而「排队」是最容易把一个好礼物变成糟糕下午的东西。

## 该告诉孩子什么
收到车的孩子，在坐进去之前应该知道两件事：怎么让它停下来；以及头一段时间里，去哪里由大人决定。这两句话提前说，都比开到一半再讲容易。

一小时的准备能覆盖全部。否则的替代方案，是把同样四个问题按顺序、当着观众的面，一个一个发现。
`,
  },

  // ---- electric_car / budget (1 -> 3) ----------------------------------
  {
    slug: "kids-ride-on-under-100",
    title: "A Ride-On Car Under 100: What You Get",
    description:
      "The entry tier in one place: what a small budget buys, what it leaves out, and which omission matters most for a first car.",
    keywords: ["ride on car under 100", "cheap ride on car", "budget ride on car", "affordable electric car kids"],
    zhTitle: "百元以内电动车：买到的到底是什么",
    zhDescription:
      "入门价位一次说清：小额预算能买到什么、会缺什么，以及其中哪一个缺失对第一辆车影响最大。",
    zhKeywords: ["百元电动车", "便宜电动车", "入门电动车", "儿童电动车预算"],
    topic: "budget",
    topicOrder: 51,
    cover: "https://store.balancebiketoddler.com/electric_vehicles/Best/Rank_Similar_ASIN_B07YC4VCYH_Best%20Choice%20Products%2012V%20Kids%20Electric%20Vehicle%20Toy/images/primary.jpg",
    en: `The entry tier of ride-on cars is honest about what it is, as long as you read the box correctly. At this price the car is small, the battery is modest, and the feature list is short. The interesting question is not what is missing, because a great deal is missing. It is which of the missing things actually matters.

## What the tier reliably includes
A small single-seat car, a rechargeable pack, a foot pedal, forward and reverse, and some combination of lights, sounds and stickers. Almost all of them steer through the front axle with a wheel or handlebars, and almost all of them run on a smooth surface at a walking pace.

That is a complete toy for a two or three year old. The child sits, presses, moves, and stops. Nothing in the list above is a compromise on that.

## What it usually leaves out
Four things, in order of how much they matter.

The first is a parental remote. Some entry cars have one and some do not, and its absence changes the toy for a young child. Without a remote, the adult's only control is physical proximity and the child's own willingness to stop.

The second is a speed lockout. A car with a single speed and no low setting has to be managed entirely by the child's foot, which is a lot to ask of a two year old.

The third is a seat that holds a small body upright. Entry cars often have a moulded bench rather than a shaped seat with a back, and a child who slides is a child who is not steering.

The fourth is suspension. On a smooth driveway it is decoration. On grass it is not.

## The omission that matters most
For a first car and a child under three, the remote is the one to prioritise. It is the difference between a toy an adult can supervise from beside the car and a toy an adult has to run behind. Everything else on the list can be worked around: a child can learn a single speed, a bench seat can be padded, and a driveway has no grass on it.

For an older child on a flat surface, the order changes. A remote matters less once a child can steer and stop, and a shaped seat matters less once they can sit still. At that point the single-speed limitation becomes the one worth paying to avoid.

## Where the money goes instead
Above this tier, the money buys battery capacity, a second seat, suspension, and the electronics for a remote. Those are real improvements and none of them is decorative. But they are improvements to a car that is already working, which is why the entry tier is a reasonable place to start rather than a false economy.

The one purchase that is a false economy is buying the entry tier for a child who has already outgrown it. A car whose seat the child no longer fits is not cheap at any price.

## How to judge a specific listing
Read the listing for four lines: whether a remote is included, whether more than one speed is offered, what the seat looks like from the side, and what surface the maker describes it for. Those four lines decide more about daily use than the badge, the sticker set, or the number of sound effects.
`,
    zh: `入门价位的电动车，只要你把包装读对，它对自己的定位是诚实的。这个价位上，车小、电池普通、配置表短。有意思的问题不是「缺了什么」——缺的东西很多——而是「缺的那些里，哪一个真的要紧」。

## 这一档稳定会给你的
一辆小的单座车、一组可充电电池、一个脚踏开关、前进与后退，再加上若干灯光、音效和贴纸。它们几乎都用前轴转向，用手柄或方向盘；也几乎都在平整地面上以步行的速度行驶。

对一个两三岁的孩子来说，这已经是一个完整的玩具：坐进去、踩下去、动起来、停下来。上面这份清单里，没有一项是在这件事上打了折扣。

## 这一档通常会省掉的
四样东西，按重要程度排。

第一是遥控。有些入门车有，有些没有，而它的有无会改变这个玩具的性质。没有遥控，大人唯一的手段就是守在旁边，以及指望孩子自己愿意停。

第二是限速档。只有单一速度、没有低档的车，完全要靠孩子的脚来控制，这对两岁的孩子要求太高。

第三是能把小身体撑住的座椅。入门车常常是一块成型的平坐板，而不是有靠背的成形座椅；会往下滑的孩子，是腾不出手来转向的孩子。

第四是减震。在平整车道上它是装饰；在草地上它不是。

## 最该优先补上的那一个
对第一辆车、对三岁以下的孩子，优先级最高的是遥控。它决定了这个玩具是「大人站在车边就能看住」，还是「大人得在后面追」。清单上其他每一项都能绕过：单一速度可以适应，平坐板可以加垫，而车道上本来就没有草。

如果对象是更大一点的孩子、场地是平整的，顺序就变了。孩子能自己转向和停车之后，遥控就没那么要紧；能坐稳之后，成形座椅也没那么要紧。到那个阶段，单速反而成了最值得花钱避开的那一条。

## 钱花到哪里去了
在这一档之上，多花的钱买的是电池容量、第二个座位、减震，以及遥控所需的电子件。这些都是实打实的改善，没有一项是装饰。但它们改善的是一辆本来就已经能用的车——这正是「从入门档起步」合理、而不是「省钱省错了」的原因。

真正省错的一种，是给一个已经长大的孩子买入门档。孩子坐不进去的车，多少钱都不便宜。

## 怎么判断一个具体链接
去商品页里找四行信息：有没有遥控、是不是不止一个速度、座椅从侧面看是什么形状、厂商说它适合什么地面。这四行对日常使用的影响，大于牌子、贴纸数量，或者音效种类。
`,
  },
  {
    slug: "kids-ride-on-price-tiers",
    title: "Ride-On Price Tiers: What Each One Buys",
    description:
      "Three price bands and the difference that actually separates them: not the badge, but what the battery and the seat can carry.",
    keywords: ["ride on car price", "ride on car value", "how much does a ride on car cost", "ride on car tiers"],
    zhTitle: "电动车三个价位段：每一段多买到了什么",
    zhDescription:
      "三个价位区间，真正拉开差距的不是牌子，而是电池能推动什么、座椅能撑住谁。",
    zhKeywords: ["电动车价格", "电动车性价比", "电动车多少钱", "电动车价位"],
    topic: "budget",
    topicOrder: 52,
    cover: "https://store.balancebiketoddler.com/electric_vehicles/Gotrax/Rank_11_ASIN_B0F5GHHDHC_Gotrax%20RT1%20Ride%20on%20Toys%20for%20Toddlers%201.5-4%20Safe%2012/images/primary.jpg",
    en: `Ride-on cars are sold in three broad bands, and the bands differ in ways that are more useful than the price itself. Understanding what each one buys turns a vague budget question into a decision about a specific child on a specific surface.

## The bottom band: a working toy
The lowest band buys a small car that moves. Single seat, modest pack, one or two speeds, sometimes a remote and sometimes not. It is complete for a toddler on a flat driveway, and it is honest about being a toy rather than a vehicle.

What it does not buy is reserve. There is no spare torque for grass, no suspension for uneven ground, and no second seat. A family that only ever uses a paved driveway will never notice.

## The middle band: the car stops being marginal
The middle band is where the car starts to handle conditions rather than only flat ground. The pack is larger, the motor has more torque, and a remote becomes standard rather than optional. Suspension appears, and so does a seat shaped to hold a child rather than a bench.

This is the band where most families land, and the reason is not the feature list. It is that the middle band is the first point at which the car can be used on grass without stalling, and grass is what most gardens have.

The middle band is also where two-seat cars begin. That doubles the useful life of the toy in a household with siblings, but it also means the same pack is now moving two children, so the terrain advantage narrows again.

## The top band: capability, and its own costs
The top band buys torque, capacity and construction. Larger packs, two seats rated for two children, real suspension, and steering that responds to input rather than merely pointing the car.

Two costs come with it, and both are easy to underestimate. The first is weight: a large car is hard to move, hard to store, and hard to lift over a step. The second is that the car is now fast enough and heavy enough that the supervision question stops being optional. A large car needs space, and it needs an adult who is actually watching.

## What does not scale with price
Several things stay constant across all three bands, and they are the ones worth checking whatever the budget.

The manual stays equally important: it states the first charge time, the weight limit and the surfaces the maker intended. Those three lines are not marketing and they do not improve with price.

The seat fit stays a question about a particular child, not a particular car. A well-made seat that is the wrong size is worse than a plain seat that fits.

And the supervision requirement never goes away. No band sells a car that a small child can use unsupervised, and price is not a proxy for that.

## Choosing a band
Start from the surface and the child, in that order. A flat driveway and a two year old is the bottom band, and paying more buys capability that will never be used. A garden and a four year old with a sibling is the middle band, because grass and a second seat are the two things that matter there. The top band is for a family with the space and the willingness to supervise a genuinely larger vehicle.

The badge on the front is the least informative thing about any of them.
`,
    zh: `电动车大致分成三个价位带，而这三个带的差别比价格本身有用得多。弄清楚每一带买到了什么，就能把一个模糊的「预算多少」变成「某个孩子、某种地面」的具体决定。

## 最低一档：一辆能用的玩具
最低一档买到的是一辆会动的小车。单座、普通电池、一到两个速度，有时有遥控、有时没有。对平整车道上的幼儿来说它是完整的，而且它对自己「是玩具不是车辆」这件事是诚实的。

它买不到的是余量。草地上没有多余扭矩，不平的地面上没有减震，也没有第二个座位。只在铺装车道上用的家庭，永远不会察觉这一点。

## 中段：车开始不再是勉强够用
中段是车开始应付「条件」而不只是「平地」的地方。电池更大、电机扭矩更足，遥控从可选变成标配。减震出现了，座椅也从一块平坐板变成能把孩子撑住的形状。

多数家庭落在这一段，原因不是配置表，而是中段是车第一次能在草地上跑而不熄火的位置——而多数花园里长的就是草。

中段也是双座车开始出现的地方。在有兄弟姐妹的家庭里，这把玩具的可用寿命翻了一倍；但同一组电池现在要推动两个孩子，地形上的优势又收窄回去一些。

## 最高一档：能力，以及它自带的代价
最高一档买到的是扭矩、承载和做工。更大的电池、能坐两个孩子的双座、真正的减震，以及「会响应输入」而不只是「把车指过去」的转向。

它自带两个代价，而且都容易被低估。第一个是重量：大车难推、难收，也难抬过一道台阶。第二个是这辆车现在又快又重，于是「有没有人看着」这件事不再可选。大车需要空间，也需要一个真的在看的大人。

## 不随价格变化的部分
有几件事在三个档位里都不变，而它们恰恰是不论预算多少都该检查的。

说明书的重要性不变：它写着首次充电时长、承重上限，以及厂商打算让这车跑什么地面。这三行不是营销文案，也不会因为贵就变好。

座椅合不合身，始终是关于某个具体孩子的问题，而不是关于某辆具体车的问题。做工很好但尺寸不对的座椅，比做工普通但刚好合身的座椅更糟。

「必须有人看着」这一条也从不消失。没有任何一个档位卖的是「幼儿可以无人看管地开」的车，价格不是这件事的替代指标。

## 怎么选一个档
先看地面，再看孩子，顺序就是这样。平整车道加两岁孩子，就是最低一档，多花的钱买到的是永远用不到的能力。花园加四岁孩子再加一个弟妹，就是中段，因为草和第二座位正是在那里要紧的两件事。最高一档，是给有空间、也愿意看住一辆真正更大的车的家庭。

至于车头那个牌子，是所有这些信息里最没有信息量的一个。
`,
  },

  // ---- electric_car / risk (1 -> 3) ------------------------------------
  {
    slug: "kids-ride-on-supervision-rules",
    title: "Where a Ride-On Car Is Safe to Drive",
    description:
      "Driveway, garden, pavement: the surface and the boundaries decide more about safety than the top speed on the box.",
    keywords: ["ride on car safety", "where to drive ride on car", "ride on car driveway", "ride on car supervision"],
    zhTitle: "电动车可以在哪里开：先划清边界",
    zhDescription:
      "车道、花园、人行道——地面和边界对安全的影响，比包装上的最高速度更大。",
    zhKeywords: ["电动车安全", "电动车在哪里开", "电动车车道", "电动车看护"],
    topic: "risk",
    topicOrder: 51,
    cover: "https://store.balancebiketoddler.com/electric_vehicles/FanttikRide/Rank_2_ASIN_B0D3LSZJK2_FanttikRide%20N7%20Pro%20Electric%20Wiggle%20Car%20with%20Pedal/images/primary.jpg",
    en: `The safety question about a ride-on car is usually framed as a question about the car: how fast, how heavy, what does it have for brakes. In practice the venue decides more. A slow car on an open slope beside a road is a worse arrangement than a faster car in an enclosed yard, and the difference is entirely about where the toy is used.

## Judge the space by its edges, not its size
A suitable space has a boundary that stops the car before it meets anything that matters. A wall, a fence, a hedge, a raised kerb. What matters is not how large the space is but whether the car can leave it without an adult noticing.

Walk the perimeter before the first drive and look for three things: gaps wide enough for the car, a slope that leads towards the gap, and anything the car could run into at the far end. A garden with a gate that opens onto a pavement is not an enclosed space, whatever its size.

## Flatness matters more than length
A ride-on car steers by pointing its front axle, and a small child corrects it slowly. On flat ground that is fine. On a slope the car accelerates by itself, the child's correction arrives late, and the adult's remote is being used to brake rather than to supervise.

If the only available space slopes, choose the flattest part of it and mark the top end. Driving downhill towards a wall is a different activity from driving on the flat, and a two year old is not learning anything useful from the first one.

## Surfaces, in order of difficulty
Smooth pavement is the easiest. Short, even grass is next, because it slows the car and softens a fall. Long or wet grass is worse: it hides unevenness and it takes torque the car may not have. Gravel and loose stones are the hardest, because they move under the wheels and the car can slide sideways without the child turning.

That ordering is also a sensible progression. Start where the surface is easiest and the child will spend the first sessions learning to steer rather than to recover.

## The boundaries that are not physical
Two rules do most of the work and neither is about the car.

The first is that a ride-on is never used near a road, a driveway entrance, or a parking area, even with an adult present. A car that a driver cannot see, moving at walking pace, is exactly the combination that goes wrong.

The second is that the adult's attention is the actual safety system. A remote within reach is not supervision if the adult is looking at a phone. The useful habit is to stand where the car's whole path is visible, which in most gardens means moving rather than sitting.

## Other children in the same space
Siblings change the calculation. The child driving is concentrating on the car; the child not driving is often running nearby and is not watching the car at all. Give the waiting child a job that keeps them outside the car's path, and treat the car's route as a space to be kept clear rather than a space to be shared.

## After the first few sessions
Once the child steers and stops reliably, the space can grow, but the edges should grow last. A larger area with the same boundaries is a reasonable next step. The same area with a boundary removed is a different activity, and it needs a fresh decision rather than an extension of the old one.
`,
    zh: `关于电动车的安全问题，通常被问成「车」的问题：多快、多重、有什么刹车。实际上，场地决定的更多。一辆慢车在一片开阔、靠马路的下坡上，比一辆更快的车在一个围合的院子里更危险——而差别完全来自「这玩具在哪里用」。

## 用边界来判断空间，而不是用面积
合适的地方，有一个在车撞上要紧的东西之前就能把车拦住的边界：墙、栅栏、树篱、一道高出路面的路缘。要紧的不是空间有多大，而是车能不能在大人物没注意到的时候离开它。

第一次开之前，绕着走一圈，找三件事：宽到能让车过去的缺口、一个通向缺口的坡、以及车在那头可能撞上的东西。一个带门、门外就是人行道的花园，不是一个围合的空间——不管它多大。

## 平整比长度更要紧
电动车靠推动前轴来转向，而小孩子的修正是慢的。平地上这没问题。在坡上，车会自己加速，孩子的修正来得太晚，遥控器就被用来刹车而不是用来看护。

如果只有斜坡可用，选其中最平的一段，并把上端标记出来。朝着一堵墙往下开，和在平地上开，是两种不同的活动；而两岁的孩子从前者身上学不到任何有用的东西。

## 地面，按难度排序
平整的铺装地面最简单。短而均匀的草坪次之，因为它让车变慢，也软化摔倒。长草或湿草更糟：它藏住不平，还吃掉了车可能没有的扭矩。碎石和松散石子最难，因为它们会在轮子下移动，车可能在没有转向的情况下横向滑开。

这个排序本身也是一个合理的进程。从最容易的地面开始，孩子头几次课就是在学转向，而不是在学「救车」。

## 不是物理的那些边界
两条规则承担了大部分作用，而两条都不是关于车的。

第一，电动车永远不在马路、车道出入口或者停车场附近使用，即使有大人在场。一辆司机看不见、以步行速度移动的车，正是最容易出事的组合。

第二，大人的注意力才是真正的安全系统。遥控器在手边，而大人在看手机，那不叫看护。有用的习惯是站到能看见车整条路线的位置——在多数花园里，这意味着要跟着走，而不是坐着。

## 同一个空间里的其他孩子
有兄弟姐妹时，算法就变了。开车的孩子在专心开车；没开车的孩子常常在旁边跑，而且完全没在看车。给等待的孩子一件能让他留在车路线之外的事，并且把车的路线当成一块要保持清空的空间，而不是一块可以共用的空间。

## 开头几次之后
当孩子能可靠地转向和停车，空间可以变大，但边界应该最后才放大。同一套边界下更大的面积，是合理的下一步。边界被去掉的同一块面积，是另一种活动，它需要一次新的决定，而不是旧决定的延长。
`,
  },
  {
    slug: "kids-ride-on-speed-control",
    title: "Speed Settings and Lockouts Explained",
    description:
      "Most ride-ons ship a low-speed setting and a lockout. Why the slower setting is the one to start on, and how to use it well.",
    keywords: ["ride on car speed settings", "ride on car lockout", "ride on car high low speed", "ride on car soft start"],
    zhTitle: "电动车的限速档与锁定：该怎么用",
    zhDescription:
      "多数电动车都带低档和一个锁定功能。为什么该从慢档开始，以及怎样把它用对。",
    zhKeywords: ["电动车限速", "电动车速度档", "电动车高低速", "电动车软启动"],
    topic: "risk",
    topicOrder: 52,
    cover: "https://store.balancebiketoddler.com/electric_vehicles/First/Rank_5_ASIN_B0FWKK3JXX_First%20Ride%20On%2036V%20Kids%20Ride%20On%20UTV%202-Seater%20400W%20E/images/primary.jpg",
    en: `Almost every ride-on car ships with more than one speed, and most ship with a lockout that restricts the car to the lower one. Those two features are the cheapest safety equipment on the vehicle and the least used, usually because the box presents them as a performance option rather than as a control.

## Two different mechanisms, often confused
A speed setting changes the top speed the car will reach. A lockout prevents the higher setting from being selected at all. They are not the same thing, and the difference matters: a two-speed car with the high gear available is a car whose speed is decided by whoever last touched the switch, which in a household with older children is not always the adult.

A soft start is a third mechanism, separate from both. It ramps the motor up over a moment instead of applying full torque immediately. It does not change the top speed at all. What it changes is the jolt at the start, which is the part that unseats a small child.

Read the listing for all three by name. A car with a soft start and no lockout is a different proposition from a car with a lockout and no soft start.

## Why the slower setting comes first
The lower setting is not a beginner mode to be graduated out of as quickly as possible. It is the setting in which a child can actually observe cause and effect: press the pedal, the car moves a little, release, it stops.

At a higher speed the same sequence happens too fast to notice. The child learns that the car goes, but not that their foot controls it. That distinction is the entire skill.

There is a second reason. A slow car gives the adult time to intervene, whether with the remote or on foot. At the higher setting the car covers ground faster than an adult can cross a garden, and the remote becomes the only option.

## Use the lockout as a rule, not a phase
The useful arrangement is that the higher setting is unlocked by an adult, for a specific session, in a specific place, and then locked again. Treating the lockout as a switch that gets flipped once and forgotten turns it into decoration.

That is especially true with more than one child. The oldest will learn the switch quickly, and the youngest will inherit whatever position it is in. A lockout that requires the key or the sequence described in the manual, rather than a button on the dashboard, is worth preferring for exactly this reason.

## When to move up
Move up when the child demonstrably stops where they intend to, not when they ask for more speed. Intentional stopping is the one behaviour that separates driving from being carried, and it is the behaviour that a higher speed puts under pressure.

A useful test that costs nothing: ask the child to drive to a particular spot and stop there. If they can, the higher setting is reasonable. If the car overshoots and the stop was luck, it is not.

## Speed is not the only variable
Two more factors decide how fast the car feels to the child. The surface is one: the same setting on grass is a slower and gentler ride than on smooth pavement. The load is the other: a heavier child, or two children, changes acceleration and braking distance on the same setting.

That means the lockout decision is not permanent. A setting that was right for one child on a driveway may be wrong for two children on a slope, and it is worth re-deciding rather than assuming.
`,
    zh: `几乎每一辆电动车都带不止一个速度，多数还带一个把车限制在低档的锁定功能。这两样是车上最便宜的安全配置，也是最常被闲置的配置——通常是因为包装把它们呈现成「性能选项」，而不是「控制装置」。

## 两套不同的机制，常被混为一谈
速度档改变的是车能达到的最高速度。锁定则是不让高档被选上。两者不是一回事，而这个差别很要紧：一辆双速车如果把高档敞开着，那么这辆车的速度就由「上一次碰那个开关的人」决定——在有哥哥姐姐的家庭里，那个人不总是大人。

软启动是第三套机制，和上面两个都不同。它让电机在一个极短的瞬间逐步加力，而不是一上来就给满扭矩。它完全不改变最高速度。它改变的是起步那一下的顿挫，而那一下正是把小孩子从座位上晃下来的部分。

在商品页里，这三样都要按名字找到。一辆有软启动但没有锁定的车，和一辆有锁定但没有软启动的车，是两种不同的东西。

## 为什么先给慢档
低档不是一个「尽快毕业出去」的新手模式。它是孩子真正能观察到因果的那个档位：踩下去，车动一点；松开，停。

在更高的速度上，同样的因果链发生得太快，来不及被注意到。孩子学到的是「车会走」，但没有学到「是我的脚让它走的」。而后一件事才是全部技能。

还有第二个理由。慢车给大人留出干预的时间——无论是用遥控，还是走过去。在更高档位上，车穿过一片花园的速度比大人走过去更快，遥控就成了唯一选项。

## 把锁定当规则用，而不是当阶段用
有用的安排是：高档由大人解锁，为某一次、某个场地；用完再锁回去。把锁定当成「拨一次就不再管」的开关，它就退化成了装饰。

家里不止一个孩子时尤其如此。大的很快就能学会那个开关，而小的会继承它当时的状态。正因为如此，一个需要钥匙、或者说明书里那套顺序才能解除的锁定，比仪表台上一个按钮更值得选。

## 什么时候升档
升档的时机，是孩子能明确地停在他们想停的地方，而不是他们开口要更快的时候。有意识地停车，是「在驾驶」和「被载着走」之间唯一的分界，也正是更高速度会去施压的那一件事。

一个不花钱又很有用的检验：让孩子开到某个指定位置并停下。做得到，高档就是合理的。如果车冲过去了、那次停下只是碰巧，那就还不合理。

## 速度不是唯一的变量
还有两个因素决定车在孩子感觉里有多快。一个是地面：同一个档位，在草地上比在平整铺装上更慢、更缓和。另一个是载重：更重的孩子，或者两个孩子，会在同一档位下改变加速和刹车距离。

这意味着锁定的决定不是一劳永逸的。对一个孩子、在车道上成立的档位，换成两个孩子、在坡上，可能就不成立；这件事值得重新决定，而不是假定。
`,
  },

  // ---- electric_car / maintenance (2 -> 3) ----------------------------
  {
    slug: "kids-ride-on-tire-wear",
    title: "Ride-On Wheels: Wear and Replacement",
    description:
      "Plastic wheels on pavement, rubber on grass: how the two wear differently, and the check that tells you a set is finished.",
    keywords: ["ride on car wheels", "ride on car tires", "replace ride on wheels", "ride on car traction"],
    zhTitle: "电动车的轮子：磨损与更换",
    zhDescription:
      "塑料轮在铺装上、橡胶轮在草地上——两种轮子磨损的方式不同，以及判断一组轮子该换了的那项检查。",
    zhKeywords: ["电动车轮子", "电动车轮胎", "更换电动车轮", "电动车抓地"],
    topic: "maintenance",
    topicOrder: 51,
    cover: "https://store.balancebiketoddler.com/electric_vehicles/LIGIANT/Rank_8_ASIN_B0DX1QQ6WC_LIGIANT%2024V%20Ride%20on%20Toys%20for%20Big%20Kids%204-Seater%20Kid/images/primary.jpg",
    en: `Ride-on wheels wear out, and they wear out in a way that is easy to miss because the car still moves. A worn wheel does not announce itself with a bang. It announces itself as a car that slides a little on a corner, spins when it starts, and eventually stops gripping at all.

## Two wheel types, two wear patterns
Most ride-ons use one of two wheels. Hard plastic wheels are common on lower-priced cars. They roll efficiently on smooth pavement and are close to indestructible on it, because there is almost nothing to wear. On anything abrasive, or on stone, plastic wears at the contact edge and goes smooth.

Rubber or rubberised wheels are common on cars intended for grass. They grip far better on soft ground and they cushion the ride. They wear more like a shoe: gradually, at the tread, and with the tread pattern disappearing before the wheel fails.

The practical difference is that plastic fails by losing grip on a hard surface, and rubber fails by losing grip on a soft one. Whichever surface the car is used on is the surface to inspect.

## The check that matters
Put the car on a flat surface and push it gently forward while watching each wheel. Three things to look for: whether the wheel turns freely, whether it wobbles as it turns, and whether all four are still roughly the same diameter.

A wheel that wobbles usually has a worn hub or a loose axle rather than a worn tyre, and it is the more urgent of the two problems because it stresses everything attached to it. A wheel noticeably smaller than the others means it has been spinning on abrasive ground, and the car will start pulling to one side.

## Why rotating and swapping is worth the effort
On a car that is used mostly in one direction of turn, the outer wheels wear faster. Swapping front to back, or left to right where the hub allows, spreads the wear and pushes a replacement further out. It takes a few minutes and it is the cheapest maintenance a ride-on gets.

It also reveals problems early, because the swap requires taking each wheel off and looking at it.

## What a replacement set should match
The wheel has to match the axle diameter and the hub fitting, and it has to be the same diameter as the ones on the other side. Mixing diameters creates a car that tracks badly and steers unevenly, which is worse than a uniformly worn set.

If the maker sells a set, prefer it, and check whether the set includes the hub fittings rather than only the tyres. A tyre without its hub is not a replacement, and the shortage is usually discovered mid-repair.

## When the whole car is the answer
A car whose frame has cracked at a wheel mount, or whose axle has bent, is not a wheel problem. Look at the mounting points when the wheels are off. If the plastic around the axle is deformed or split, replacing wheels will not fix it, and continuing to drive it is how a small fault becomes a fall.

That inspection is the reason to take the wheels off at least once a season rather than only when something looks wrong. The wheels themselves are cheap; the mounting points are the part that decides whether the car is still worth repairing.
`,
    zh: `电动车的轮子会磨损，而且磨损的方式很容易被忽略，因为车仍然在动。磨坏的轮子不会「砰」地声明自己。它表现为：过弯时有一点侧滑、起步时打滑，最后彻底失去抓地。

## 两种轮子，两种磨法
多数电动车用的是两种轮子之一。硬塑料轮在低价车上很常见。在平整铺装上它滚得省力，而且几乎是磨不坏的——因为几乎没有可磨的东西。但在任何有磨蚀性的地面、或者石子上，塑料会在接触边缘被磨平、变滑。

橡胶或类橡胶轮，常见于打算跑草地的车。它在软地面上抓地好得多，也吸震。它的磨损更像一双鞋：逐渐发生在胎面，花纹在轮子彻底失效之前就先消失了。

实际差别是：塑料轮失效表现为「在硬地面上失去抓地」，橡胶轮失效表现为「在软地面上失去抓地」。车常跑哪种地面，就检查哪种。

## 真正有用的那项检查
把车放在平整地面上，轻轻往前推，同时看着每一个轮子。看三件事：轮子转得顺不顺、转的时候晃不晃、四个轮子的直径是否还大致相同。

会晃的轮子，通常是轮毂磨损或者轴松了，而不是胎磨了；而这在两者之中更急，因为它会给所有连在它上面的东西加力。明显比别的轮子小的那个，是在有磨蚀性的地面上磨掉的，车会开始偏向一侧。

## 换位为什么值得做
在总往一个方向转的车上，外侧轮磨得更快。前后对调，或者在轮毂允许时左右对调，能把磨损摊开，把换新的时间往后推。这只要几分钟，却是电动车上最便宜的一项保养。

它还能提前暴露问题，因为换位的前提是把每个轮子都拆下来看一眼。

## 一套替换轮该对上什么
轮子必须对上轴的直径和轮毂的配合，也必须和另一侧同直径。混用不同直径会造成一辆走线很歪、转向很不匀的车，那比一组均匀磨损的轮子更糟。

如果厂商卖整组，优先选它的，并且确认这一组里包含轮毂配件而不只是胎。没有轮毂的胎不算替换件，而缺件这种事，通常在修到一半时才发现。

## 什么时候该换的不是轮子
车架在轮子安装处开裂、或者轴弯了的车，不是轮子的问题。把轮子拆下来的时候，看一眼安装点。如果轴周围的塑料已经变形或裂开，换轮子修不好它，而继续开，就是让一个小故障变成一次摔倒的过程。

这也是为什么至少每季该把轮子拆一次，而不是等到看起来不对劲才拆。轮子本身很便宜；安装点才是决定这辆车还值不值得修的地方。
`,
  },

  // ---- electric_car / best (2 -> 3) -----------------------------------
  {
    slug: "kids-ride-on-best-6-year",
    title: "Best Ride-On Car for a 6-Year-Old",
    description:
      "By six, a child has usually outgrown the toddler single-seater. What to look for instead: room, a higher limit, real steering.",
    keywords: ["best ride on car for 6 year old", "ride on car for big kids", "ride on car age 6", "24v ride on car"],
    zhTitle: "六岁孩子的电动车：该看什么",
    zhDescription:
      "到了六岁，孩子通常已经坐不进幼儿单座车了。这时该看的是空间、承重上限，以及真正的转向。",
    zhKeywords: ["六岁电动车", "大童电动车", "儿童电动车推荐", "24V电动车"],
    topic: "best",
    topicOrder: 51,
    cover: "https://store.balancebiketoddler.com/electric_vehicles/Kids/Rank_3_ASIN_B017HHKGIE_Kids%20Motorcycle%20-%203-Wheel%20Ride%20on%20Toy%20with%20Police/images/primary.jpg",
    en: `A six-year-old is the point at which a ride-on car stops being a seat and starts being a vehicle. The toddler single-seater that was right at three is usually too small in every dimension: the seat, the legroom, the weight the frame was designed to carry, and often the interest level too.

What replaces it is a different kind of purchase, and the criteria change with it.

## Room is the first criterion
The child should be able to sit with their knees bent comfortably and their feet able to reach the pedals without stretching. That sounds obvious and it eliminates a large share of the market, because many cars are designed around a smaller occupant and the seat does not move back.

Look at three measurements against the child rather than against the age on the box: the distance from the seat back to the pedals, the width of the seat, and the height from the seat to the top of the child's head if the car has a roof. A car with a roof that the child's head touches is a car they will not enjoy.

## The weight limit is a ceiling, not a target
Every listing states a limit, and by six the child is closer to it than they were at three. Read the limit as the total the car is designed to move, which includes the child, their clothes, and anything they carry aboard. A limit the child is already near leaves no margin for a second child, a slope, or a hill start.

That margin is the reason the larger categories exist. A car rated well above the child's weight will run cooler, climb better, and last longer than one that is at its rated edge from the first day.

## Steering that responds to input
Small toddler cars steer by pointing the front axle with a wheel or handlebars, and the mechanism is deliberately forgiving. Cars built for older children often have steering that responds more directly, which is what makes them interesting to drive and also what requires the child to actually pay attention.

If the car offers a parental remote, that is a safety net rather than a controller at this age. A six-year-old should be driving; the remote is for the moment something goes wrong, not for the whole session.

## Seats, and the sibling question
Two seats change the purchase. A second seat extends the car's usefulness in a household with siblings, and it also doubles the load, so a two-seat car needs the weight limit to cover two children and not one.

The useful question is whether the second seat will actually be used or whether it will be empty most of the time while adding weight and cost. In a house with children two years apart, it is used. In a house with one child, it is ballast.

## What to stop paying for
At six, the decorative features lose their value quickly. Lights, sounds and licensed badges are things a younger child notices. A six-year-old notices whether the car goes where they point it, whether it is fast enough to be interesting on a longer straight, and whether their knees fit.

That is also why a larger, plainer car is usually a better buy at this age than a smaller, more decorated one at the same price. The child has changed; the criteria should change with them.
`,
    zh: `六岁是电动车从「一个座位」变成「一辆车」的分界线。三岁时正合适的幼儿单座车，到这个年龄通常在每一个维度上都小了：座椅、腿部空间、车架设计承重，以及往往还有兴趣本身。

接替它的，是另一种性质的购买，标准也随之改变。

## 空间是第一标准
孩子应该能坐着、膝盖自然弯曲，脚不用伸直就能够到踏板。这听起来是废话，但它会淘汰市场上很大一部分车——因为很多车是按更小的乘坐者设计的，而座椅不能后移。

拿三个尺寸去对孩子，而不是对箱子上的年龄：座背到踏板的距离、座椅宽度、以及如果车有顶棚，从座椅到孩子头顶的高度。顶棚会碰到头的车，孩子不会喜欢坐。

## 承重上限是天花板，不是目标
每个商品页都写着上限；而到了六岁，孩子离这个上限比三岁时更近。要把这个上限读成「这辆车设计要推动的总重量」，它包括孩子、衣服，以及任何带上车的东西。一个孩子已经逼近的上限，就不会再留出余量给第二个孩子、一个坡、或者一次坡起。

这个余量，正是更大一级车存在的理由。额定承重明显高于孩子体重的车，会比一辆从第一天就在额定边缘上的车跑得更凉、爬得更好、也活得更久。

## 会响应输入的转向
幼儿小车用方向盘或手柄推动前轴转向，这套机构是刻意做得宽容的。为更大孩子造的车，转向往往更直接——这让它开起来有意思，也正是它要求孩子真的专心的地方。

如果这辆车带遥控，在这个年龄它是安全网，而不是操控器。六岁的孩子应该在开车；遥控是为了「出事的那一刻」，而不是为了整场。

## 座位，以及兄弟姐妹的问题
两个座位会改变这笔购买。在有兄弟姐妹的家庭里，第二个座位延长了车的可用期；同时它也让载重翻倍，所以双座车的承重上限必须能覆盖两个孩子，而不是一个。

有用的问题是：第二个座位到底是真会被用，还是大部分时间空着、只增加了重量和价钱。孩子相差两岁的家庭，会用到。只有一个孩子的家庭，那是压舱物。

## 可以不再为之付钱的部分
到了六岁，装饰性配置的价值掉得很快。灯、音效、授权标志，是更小的孩子会注意的东西。六岁的孩子注意的是：车会不会去他要它去的地方、在长一点的直道上够不够有意思、以及膝盖放不放得下。

这也是为什么这个年龄上，一辆更大、更朴素的车，通常比同样价钱下一辆更小、更花哨的车更值得买。孩子已经变了，标准也该跟着变。
`,
  },
];

const SCOOTER_ARTICLES = [
  // ---- scooter / beginner (1 -> 3) -------------------------------------
  {
    slug: "kids-scooter-first-three-wheel",
    title: "A First Scooter: Why Three Wheels First",
    description:
      "A three-wheel scooter stands up on its own, so a small child can concentrate on pushing and steering. Why that order works.",
    keywords: ["first scooter", "3 wheel scooter for toddler", "lean to steer scooter", "toddler scooter"],
    zhTitle: "第一辆滑板车：为什么先选三轮",
    zhDescription:
      "三轮滑板车自己就能立住，小孩子可以把注意力放在蹬地和转向上。这个顺序为什么成立。",
    zhKeywords: ["第一辆滑板车", "幼儿三轮滑板车", "倾斜转向滑板车", "儿童滑板车"],
    topic: "beginner",
    topicOrder: 41,
    cover: "https://store.balancebiketoddler.com/scooters/Besrey/Rank_12_ASIN_B0BPXRVWYK_Besrey%20Kick%20Scooter%20for%20Kids%20Ages%203-10%203-Wheel%20Fol/images/primary.jpg",
    en: `A scooter looks simpler than a balance bike and is not. The child stands on a platform narrower than their feet, holds a bar that moves, and has to push off without falling sideways. Three wheels is what makes that survivable for a two or three year old.

## The physics of the first choice
A two-wheel scooter falls over when it stops. It has to be balanced continuously, including at the moment the child steps on, which is precisely the moment they have the least control.

A three-wheel scooter with two wheels at the front stands up on its own. A child can step on, stand still, look around, and step off without the scooter moving at all. That stability is not a lower grade of scooter; it is the thing that lets the child concentrate on the two skills that remain: pushing, and steering.

## Lean-to-steer, and why it matters later
Most three-wheel scooters steer by leaning rather than by turning the handlebar. The child shifts their weight and the front wheels follow. It feels odd to an adult and is intuitive to a child, because they are already used to shifting weight to make their body move.

The reason it matters beyond the scooter is that leaning to turn is the same skill a balance bike teaches and the same one a bicycle needs. A child who has spent a year leaning a scooter into turns arrives at a bike already knowing what a lean does.

A handlebar that turns instead of leaning is easier to understand and teaches less. Either is workable; the lean version transfers more.

## What to check on the scooter itself
Four things, in order.

The deck height. A low deck means the child's pushing foot starts closer to the ground, which means less bending and more pushing. A high deck makes a small child work hard for very little.

The handlebar range. The bar should sit between the child's waist and their chest, and it should be adjustable through enough range that the scooter lasts more than one season. A bar that only adjusts by a couple of centimetres is a bar that will be too low by next summer.

The brake. Most three-wheel scooters have a rear fender brake that the child presses with their heel. Check that a small foot can reach it while standing on the deck, because a brake that cannot be reached is not one.

The weight. A scooter the child cannot lift is a scooter that an adult carries, which is fine on the way out and tedious on the way back.

## The first sessions
Find a flat, smooth, empty stretch. The child stands on the deck with both hands on the bar, and the first goal is not movement at all: it is standing still without wobbling, and stepping off deliberately.

Then one push, and stop. Then two pushes. The scooter will feel slow for a while, and that is the correct pace. A child who is being pushed faster than they can steer is learning to be a passenger.

## When three wheels is finished
A child is ready to consider two wheels when they steer by leaning without thinking about it, stop where they intend to, and step off without looking down. That is usually somewhere between four and seven, and it depends far more on practice than on age.
`,
    zh: `滑板车看起来比平衡车简单，其实不是。孩子要站在一块比自己脚还窄的板上，握着一根会动的杆，还得在不往侧面倒的前提下蹬出去。三轮，就是让两三岁的孩子能做成这件事的原因。

## 第一选择背后的道理
两轮滑板车一停下来就会倒。它需要被持续地平衡，包括孩子踩上去的那一刻——而那恰好是他们控制力最弱的一刻。

前二后一的三轮滑板车，自己就能立住。孩子可以踩上去、站着不动、四处看看、再下来，整个过程车都不用动。这种稳定不是「低一等的滑板车」，它正是让孩子能把注意力集中到剩下那两件事上的东西：蹬，和转向。

## 倾斜转向，以及它后来为什么重要
多数三轮滑板车靠倾斜而不是转动车把来转向。孩子移动重心，前轮跟着走。大人会觉得别扭，孩子却觉得自然，因为他们本来就习惯用移动重心来让自己的身体动起来。

它超出滑板车本身的意义在于：靠倾斜转弯，正是平衡车教的那件事，也正是自行车需要的那件事。用一年时间把滑板车压进弯道的孩子，走到自行车面前时，已经知道「倾」是怎么回事了。

会转动的车把更好理解，但教的东西更少。两种都能用；倾斜的那种迁移性更强。

## 在车上要检查的四件事
按顺序。

踏板高度。踏板低，孩子蹬地的那只脚起点就离地面近，弯腰更少、蹬得更多。踏板高的车，会让小个子花很大力气换很小的前进。

车把范围。车把应该落在孩子的腰和胸之间，而且可调范围要足够宽，让这辆车能撑过不止一个季节。只调几厘米的车把，到明年夏天就太低了。

刹车。多数三轮车是后挡泥板刹车，孩子用脚跟踩。要确认孩子站在踏板上时小脚能够到——够不到的刹车不算刹车。

重量。孩子抬不动的滑板车，就是大人来拎的滑板车。出门时这没问题，回来时就烦人了。

## 头几次
找一段平整、光滑、空旷的地方。孩子双脚站在踏板上、双手扶把，第一个目标根本不是「动」——而是站着不晃，以及有意识地下来。

然后蹬一下，停。再蹬两下。有一阵子车会显得很慢，而那个节奏是对的。一个被推得比自己能转向的速度更快的孩子，学到的是「当乘客」。

## 三轮什么时候算结束
当孩子不用想就会靠倾斜转向、想停就停、不用低头就能下来的时候，就可以考虑两轮了。这个时间通常落在四岁到七岁之间，而它取决于练了多少，远大于取决于几岁。
`,
  },
  {
    slug: "kids-scooter-two-wheel-transition",
    title: "Moving a Child From Three Wheels to Two",
    description:
      "The move to two wheels is a balance question, not an age one. The signs that say a child is ready, and the ones that do not.",
    keywords: ["3 wheel to 2 wheel scooter", "when two wheel scooter", "kids scooter transition", "two wheel scooter for kids"],
    zhTitle: "从三轮换到两轮：看什么信号",
    zhDescription:
      "换两轮是平衡问题，不是年龄问题。真正说明孩子准备好的是哪些迹象，哪些不是。",
    zhKeywords: ["三轮换两轮", "几岁换两轮滑板车", "滑板车过渡", "儿童两轮滑板车"],
    topic: "beginner",
    topicOrder: 42,
    cover: "https://store.balancebiketoddler.com/scooters/Razor/Rank_3_ASIN_B01EN6LTAQ_Razor%20A%20Kick%20Scooter%20for%20Kids%20-%20Lightweight%20Foldab/images/primary.jpg",
    en: `The move from a three-wheel scooter to a two-wheel one is usually timed by age, and age is the worst available signal. Two children of the same age can be a year apart in readiness, and the difference is almost entirely about how much time they have spent steering rather than being steered.

## The signals that mean ready
Four behaviours, all observable, none of them about age.

The child steers by leaning without appearing to think about it. On a three-wheeler that means the lean has become automatic rather than deliberate.

The child stops where they intend to, not where the scooter happens to stop. Ask them to stop at a particular paving slab and watch whether they do.

The child steps off without looking down, and without the scooter tipping. That is a balance and confidence test in one.

The child coasts. Pushing, then lifting both feet and letting the scooter roll, is the closest thing a three-wheeler offers to the balance a two-wheeler needs.

## The signals that do not mean ready
Height and age are the tempting ones and both are unreliable. A tall four-year-old who has ridden for a month is less ready than an average six-year-old who has ridden for two years.

Asking for a two-wheeler is not a signal either, though it is worth listening to. The request usually means the child has noticed that older children ride faster, which is a good reason to want one and not evidence of readiness.

Speed is also misleading. A child who is fast on three wheels is often fast because the scooter is stable, not because they are balanced. Take the stability away and the speed goes with it.

## Make the transition reversible
Keep the three-wheel scooter. A child who moves to two wheels and finds it harder than expected should be able to go back for an afternoon without it being a defeat. Children who are allowed to retreat generally return to the harder thing sooner than children who are made to commit.

If the two-wheel scooter arrives as a replacement rather than an addition, the child has no fallback and the stakes on the first ride become unnecessarily high.

## The first ride on two wheels
Start on flat, smooth ground with nothing to hit. The child stands with both feet on the deck, both hands on the bar, and the first exercise is the same as on three wheels: stand still. A two-wheel scooter will not do that on its own, so the child holds the bar and finds the balance point with an adult standing by but not holding.

Then one push and coast. Not push and ride. The goal of the first several sessions is gliding with both feet off the deck, because that is the only part of scooting that requires balance.

Falls at this stage are usually sideways and slow, at near-zero speed. A helmet and knee pads are not a formality here; they are what lets the child try again after the first one.

## Wheels and the surface
Small hard wheels, which most two-wheel scooters have, work well on smooth pavement and poorly on anything else. A child learning on a cracked sidewalk will feel every joint through the bar and will read the vibration as instability.

Choose the smoothest available surface for the transition. It removes a variable the child is not yet able to separate from their own balance.
`,
    zh: `从三轮换到两轮，通常按年龄来定，而年龄是最差的信号。同龄的两个孩子，准备程度可能差上一整年，而这个差别几乎完全来自「他们花了多少时间在转向，而不是被转向」。

## 说明可以换的信号
四个行为，都能被观察到，没有一个跟年龄有关。

孩子靠倾斜转向，而且看起来不费思量。在三轮车上，这意味着「倾」已经变成自动的，而不是刻意的。

孩子停在他们想停的地方，而不是车碰巧停下的地方。让他停在某一块特定的地砖上，然后看他做不做得到。

孩子不用低头就能下来，而且车不会侧翻。这一条同时是平衡测试和信心测试。

孩子会「溜」。蹬一下，然后把两只脚都抬起来让车滑行——这是三轮车能提供的、最接近两轮所需平衡的动作。

## 不说明问题的信号
身高和年龄是最容易被拿来用的两个，而两个都不可靠。一个练了一个月的高个四岁孩子，比一个练了两年的普通六岁孩子更没准备好。

「孩子想要两轮」也不是信号，虽然值得听。这个要求通常意味着孩子注意到大孩子骑得更快——这是想要一辆车的充分理由，却不是准备好的证据。

速度同样会误导。在三轮车上很快的孩子，快的往往是因为车稳，而不是因为他平衡好。把稳定性拿走，速度也就跟着走了。

## 让这次过渡可以退回去
三轮车留着。换到两轮之后发现比想象中难的孩子，应该能退回三轮车过一个下午，而这不算是失败。被允许退回去的孩子，通常比被要求「既然换了就不许回头」的孩子更快回到更难的那件事上。

如果两轮车是作为「替换」而不是「增加」到来的，孩子就没有退路，而第一次骑的赌注就被抬得没有必要地高。

## 两轮上的第一次
从平整、光滑、没有东西可撞的地面开始。孩子双脚站在踏板上、双手扶把，第一个练习和三轮时一样：站着不动。两轮车自己不会做这件事，所以孩子扶着把找平衡点，大人在旁边站着但不扶着。

然后蹬一下、滑行。不是蹬一下、骑起来。头几次的目标是「两只脚都离板地滑行」，因为那是滑板车里唯一真正需要平衡的部分。

这个阶段的摔，多数是侧向的、慢的、接近零速的。头盔和护膝在这里不是走形式；它们是孩子摔了第一次之后还敢再试的原因。

## 轮子与地面
多数两轮滑板车用小的硬轮，在平整铺装上表现好，在别的地面上表现差。在开裂人行道上练车的孩子，会从车把上感到每一道缝，并会把那种震动理解成「不稳」。

换两轮的时候，选你能找到的最平的地面。这样就去掉了一个变量——一个孩子还没有能力与自己平衡感区分开来的变量。
`,
  },

  // ---- scooter / risk (1 -> 3) -----------------------------------------
  {
    slug: "kids-scooter-brake-reach",
    title: "Scooter Brakes: Reach Before Power",
    description:
      "A brake a small hand or heel cannot reach is not a brake. How to test reach before the first ride, and what to do if it fails.",
    keywords: ["scooter brake reach", "kids scooter brake", "rear foot brake scooter", "scooter stopping"],
    zhTitle: "滑板车的刹车：先看够不够得着",
    zhDescription:
      "小脚够不到、小手捏不动的刹车，不算刹车。第一次骑之前怎么测，够不到又该怎么办。",
    zhKeywords: ["滑板车刹车", "儿童滑板车刹车", "后踩刹车", "滑板车怎么停"],
    topic: "risk",
    topicOrder: 41,
    cover: "https://store.balancebiketoddler.com/scooters/Hurtle/Rank_4_ASIN_B07VY9Q95Q_Hurtle%203-Wheeled%20Scooter%20for%20Kids%20-%20Wheel%20LED%20Ligh/images/primary.jpg",
    en: `Most scooters for children stop with a rear fender brake: the child presses down on the back of the deck with a heel, the fender bends onto the rear wheel, and the scooter slows. It is a good system. It is also the system most likely to be unusable by the child it was bought for, for a reason nobody checks in the shop.

## The reach problem
The brake works only if the child's foot can press it while the child is standing on the deck with their weight distributed and their hands on the bar. That is a different posture from the one a child adopts when an adult asks them to demonstrate the brake in a shop, where they will happily stand on one leg and press with the other.

The real test is the riding posture. Child on the deck, both hands on the bar, both feet on the board. Then ask them to press the brake. If they have to shift their weight off the deck, move a hand, or bend forward to reach it, the brake is out of range and the child cannot use it while riding.

## Why the failure is silent
A brake that cannot be reached does not look broken. The part is present, it moves, and an adult can operate it easily with a hand or a bigger foot. Nothing in the listing says "this brake suits riders above a certain height".

The consequence appears later, and in a specific way. A child who cannot brake does not stop; they step off, or run into whatever was in front of them. Both are read afterwards as the child's mistake rather than the scooter's geometry.

## What to do if the reach fails
Three options, in order of preference.

Lower the handlebar if the range allows. A lower bar brings the child's posture closer to the brake and often solves the problem outright, at the cost of some future adjustability.

Move the child's stance. Some children stand with their feet too far forward; bringing the back foot closer to the fender shortens the reach. This is a coaching fix rather than a hardware one and it is worth trying first, because it costs nothing.

Change the scooter. If neither works, the scooter is the wrong size, and no amount of practice will change that. A scooter the child cannot stop is not a scooter they should be riding, however well they steer it.

## Teaching the brake as a decision
Once reach is solved, the brake needs to become a decision rather than a reflex. The exercise that works is a target: pick a point on the pavement, ask the child to stop at it, and repeat.

Most children initially brake far too early, because pressing the fender feels like committing. That is fine. Early braking is a decision. Late braking, or no braking, is the thing being fixed.

## Hand brakes and the front wheel
Some scooters, mostly larger ones, have a hand brake on the bar. If it operates on the front wheel, treat it as a second-stage tool, introduced after the rear is reliable. A front brake applied hard on a small wheel pitches the scooter forward, and the child's instinct is to grip harder.

## The check that takes ten seconds
Before every ride in the first few weeks: child on the deck, both hands on the bar, press the brake. If the scooter does not slow, stop the session and fix the reach. It is a cheaper habit than the alternative.
`,
    zh: `多数儿童滑板车用后挡泥板刹车：孩子用脚跟往下压踏板尾部，挡泥板压到后轮上，车就慢下来。这是个好设计。它同时也是最容易被「买它的那个孩子」用不上的设计，原因在于一个在店里没人会去检查的地方。

## 够不着的问题
刹车能起作用的前提是：孩子站在踏板上、重心分布正常、双手扶着车把时，那只脚能踩到它。这和「大人让孩子在店里演示一下刹车」时的姿势不一样——在店里，孩子会很乐意单脚站着、用另一只脚去踩。

真正的测试是骑行姿势。孩子站在踏板上，双手扶把，双脚都在板上。然后让他踩刹车。如果他必须把重心移开踏板、松开一只手、或者往前弯腰才够得到，那么这个刹车超出了一臂之遥，孩子骑的时候用不了它。

## 为什么这个失效是无声的
够不到的刹车看起来不像坏的。零件在，会动，大人用手或者用更大的脚一踩就灵。商品页上也不会写「此刹车适合某一身高以上的骑手」。

后果是后来才出现的，而且形式很具体。刹不住的孩子不会停下来；他们会跳下来，或者撞上前面的东西。两件事事后都会被读成「孩子的失误」，而不是「车的几何不合适」。

## 够不到的时候怎么办
三个选项，按优先级。

如果车把可调范围允许，把它调低。更低的车把让孩子的姿势离刹车更近，常常直接解决问题，代价是牺牲一点以后的可调空间。

调整站姿。有些孩子脚站得太靠前；把后脚往挡泥板方向挪一点，就缩短了距离。这是教练层面的修法而不是硬件层面的，值得先试，因为它不花钱。

换车。如果两个都不管用，那这辆车的尺寸就不对，再多的练习也改变不了。一辆孩子停不下来的滑板车，不管他转向多好，都不该是他骑的那辆。

## 把刹车教成一个决定
够得到之后，刹车需要从「条件反射」变成「一个决定」。有效的练习是给一个目标：在路面上选一个点，让孩子停在那里，重复。

多数孩子一开始会刹得太早，因为压挡泥板让人感觉像在「交出控制」。这没关系。刹得早是一个决定。刹得晚、或者不刹，才是要被修掉的那件事。

## 手刹与前轮
有些滑板车——主要是更大的那些——车把上有手刹。如果它作用在前轮，就把它当第二阶段的工具，在后刹可靠之后再引入。小轮径上猛地捏前刹，会把车往前掀，而孩子的本能是「捏得更紧」。

## 十秒钟的检查
头几周，每次骑之前：孩子站上踏板，双手扶把，踩刹车。如果车不减速，就停下这次，先把距离修好。这个习惯比它的替代方案便宜得多。
`,
  },
  {
    slug: "kids-scooter-riding-surface",
    title: "Where a Kids Scooter Handles Well",
    description:
      "Smooth pavement, cracked sidewalk, gravel: which surfaces a kick scooter is built for, and the ones that turn a ride into a fall.",
    keywords: ["where to ride scooter", "scooter on gravel", "kids scooter surface", "scooter sidewalk safety"],
    zhTitle: "儿童滑板车适合什么地面",
    zhDescription:
      "平整铺装、开裂人行道、碎石——滑板车到底是为哪种地面造的，哪些地面会把一次滑行变成一次摔倒。",
    zhKeywords: ["滑板车地面", "滑板车碎石", "儿童滑板车路面", "滑板车人行道"],
    topic: "risk",
    topicOrder: 42,
    cover: "https://store.balancebiketoddler.com/scooters/Jetson/Rank_13_ASIN_B08ZCM11J6_Jetson%20Jupiter%20Kids%202-Wheel%20Light-Up%20Kick%20Scooter/images/primary.jpg",
    en: `A kick scooter is a machine for smooth ground. That is not a limitation anyone advertises, because the photographs are always taken on smooth ground, and because the scooter will technically roll on almost anything. The question is what happens when it does.

## The wheel is the whole story
Small, hard wheels roll over a surface by deforming it slightly less than the surface deforms them. On smooth pavement that is efficient and quiet. On a rough surface the wheel meets each irregularity as a small step, and the scooter loses speed, vibrates, and sometimes stops.

The smaller the wheel, the larger each irregularity is in proportion. That is why the same crack is trivial on a bicycle with large wheels and significant on a scooter with small ones.

## Surfaces, from good to bad
Smooth asphalt and poured concrete are what the machine is for. Both are flat, hard and continuous.

Paving slabs are usually acceptable, with one caveat: the joints. A slab that sits a few millimetres proud of its neighbour is a step the wheel has to climb, and a series of them turns a smooth ride into a rattling one. On a scooter with small wheels, proud slabs are felt through the bar, and a child reads that as the scooter being unstable.

Cracked or broken pavement is worse. A crack wide enough to catch a wheel is a stopping event, and the child's momentum carries them forward over the bar. This is the single most common way a scooter ride ends badly, and it has nothing to do with speed or skill.

Loose gravel and sand are the worst common surface. The wheels do not roll so much as plough, and the scooter can slide sideways without the child turning. There is no technique that makes a kick scooter good on gravel; there is only avoiding it.

Grass is a special case. Short, dry grass will roll, slowly and with effort. Long or wet grass hides unevenness and holds the wheels, and the scooter will stop without warning.

## The wet-surface problem
Water changes two things. It reduces the grip of a hard wheel on a hard surface, and it makes the fender brake far less effective, because the fender has to squeeze water out from between itself and the wheel before it can slow anything.

Braking distances on a wet pavement are much longer than on a dry one at the same speed. A child who has learned to stop at a particular point in the dry will overshoot that point in the wet, and will not understand why.

## Choosing a route
For a child, the useful habit is to pick the route by surface rather than by distance. A slightly longer route on continuous smooth pavement is a better scooter route than a short one with joints, cracks and a gravel patch in the middle.

Walk the route once before the child rides it, and look at the ground rather than at the traffic. The places to note are the ones where the surface changes: a driveway apron that sits proud, a tree root that has lifted the slabs, a patch where the asphalt has crumbled at the edge.

## What the child should know
Two instructions cover most of it. Look at the ground ahead rather than at their feet, so a change in surface is seen while there is still time to slow. And get off and carry the scooter over anything that looks like it would stop them, because walking over an obstacle takes three seconds and falling on one takes longer.
`,
    zh: `滑板车是一台为平整地面而生的机器。这不是哪个厂商会去宣传的限制，因为宣传照永远拍在平整地面上，而且因为滑板车在技术上几乎什么地面都能滚。问题在于，滚起来之后会发生什么。

## 轮子就是全部
小而硬的轮子滚过地面时，自身形变比地面形变小。在平整铺装上，这既省力又安静。在粗糙地面上，轮子把每一处不平都当成一个小台阶，于是车失速、震动，有时直接停住。

轮子越小，每一处不平在比例上就越大。这就是为什么同一条裂缝，对轮子大的自行车不算什么，对轮子小的滑板车却很要紧。

## 地面，从好到坏
平整沥青和整体浇筑的混凝土，就是这机器的用武之地。两者都平、硬、连续。

铺装石板通常可以接受，但有一个前提：接缝。比邻块高出几毫米的石板，就是一个轮子要爬上去的台阶；一串这样的台阶，会把顺畅的滑行变成持续的颠簸。在小轮滑板车上，凸起的石板会通过车把传上来，而孩子把那种震动理解成「车不稳」。

开裂或破损的铺装更糟。宽到能卡住轮子的裂缝，是一次「停车事件」，而孩子的惯性会把他们从车把上送出去。这是滑板车最常见的一种「糟糕收场」，它和速度、技术都没有关系。

松散碎石和沙子是最糟的常见地面。轮子不是滚，而是在「犁」，车可能在孩子没有转向的情况下横向滑开。没有任何技巧能让踢踏滑板车在碎石上变好；只有避开它。

草地是特例。短而干的草能滚，慢而费力。长草或湿草藏住不平、又抓住轮子，车会毫无预兆地停住。

## 湿地面这件事
水改变两件事。它降低硬轮在硬地面上的抓地力；它也让挡泥板刹车效果差很多，因为挡泥板必须先把自身与轮子之间的水挤出去，才能开始减速。

同样的速度下，湿铺装上的刹车距离比干路面长得多。一个在干地上练熟了「在某个点停下」的孩子，在湿地上会冲过那个点，而且不明白为什么。

## 怎么选路线
对孩子来说，有用的习惯是「按地面选路线」，而不是按距离选。在连续平整的铺装上绕远一点，比走一条有接缝、有裂缝、中间还有一片碎石的近路更好。

孩子骑之前，大人先走一遍，而且要看地，不是看车。要记下的是地面发生变化的地方：高出一点的车道接口、把石板顶起来的树根、沥青边缘碎掉的那一段。

## 该告诉孩子的两句话
两句就够覆盖大部分情况。看前方地面，而不是看自己的脚——这样地面变化还被来得及减速的时候就被看见了。以及，遇到任何看起来会把自己拦停的东西，就下来把车拎过去：走过去三秒钟，摔在上面更久。
`,
  },

  // ---- scooter / best (2 -> 3) -----------------------------------------
  {
    slug: "kids-scooter-best-3-wheel-toddler",
    title: "Best 3-Wheel Scooter for a Toddler",
    description:
      "What separates a useful toddler scooter from a decorative one: deck height, steering type, and how far the bar actually adjusts.",
    keywords: ["best 3 wheel scooter toddler", "best toddler scooter", "best scooter for 2 year old", "lean to steer toddler scooter"],
    zhTitle: "幼儿三轮滑板车：怎么挑一辆有用的",
    zhDescription:
      "把「有用的幼儿滑板车」和「好看的幼儿滑板车」分开的，是踏板高度、转向方式，以及车把到底能调多少。",
    zhKeywords: ["幼儿三轮滑板车", "两岁滑板车", "幼儿滑板车推荐", "倾斜转向"],
    topic: "best",
    topicOrder: 41,
    cover: "https://store.balancebiketoddler.com/scooters/Gotrax/Rank_1_ASIN_B0CCYMV1T1_Gotrax%20KS1%20Kids%20Kick%20Scooter%20LED%20Lighted%20Wheels%20an/images/primary.jpg",
    en: `The toddler scooter market is full of scooters that photograph well and ride badly, and the difference is visible on the listing if you know which four lines to read. None of them is the colour, the lights, or the character on the deck.

## Deck height decides how much work it is
A toddler's pushing leg is short. Every centimetre the deck sits above the ground is a centimetre the child has to bend to reach it, and a scooter with a high deck turns pushing into a squat.

Low decks are the reason the smallest scooters look almost flat. That is a functional choice, not a styling one. Compare the deck height against the child's lower leg rather than against the age on the box: the deck should sit well below the knee on a child standing beside it.

## Lean-to-steer versus a turning bar
Most toddler scooters steer by leaning. The child shifts weight and the front wheels follow. It is more stable at low speed and it teaches the balance a bike will later need.

Some steer by turning the handlebar. It is easier to understand at first and it transfers less.

Either works. The one to avoid is a bar that claims to do both and does neither cleanly, because the child cannot build a consistent expectation of what their hands and their weight each do.

## The handlebar range is the hidden lifespan
A toddler scooter's useful life is set by how far the bar adjusts, not by how sturdy the deck is. A bar with three or four steps over a meaningful range will last several seasons. A bar that adjusts by two centimetres is a bar that will be too low within a year, and the scooter will be replaced while the deck is still perfect.

Check the range in absolute terms, and check that the clamp holds at the top of the range. A bar that slips down under a leaning child is worse than a fixed bar.

## The brake, once more
Rear fender brakes are standard and they only work if the child's heel can reach the fender while standing on the deck with both hands on the bar. Test that posture, not the one-legged demonstration.

## Weight, and who carries it
A toddler cannot carry a scooter for long. The person who will actually carry it is the adult, usually one-handed, often alongside a child. A lighter scooter with a fold mechanism is a better purchase than a heavier one without, even if the heavier one has a nicer deck.

## What the extra money buys, and what it does not
Above the entry level, money buys bearing quality, a smoother fold, and better wheels. It does not buy stability, which is a function of the three-wheel layout, and it does not buy a longer usable life, which is a function of the bar range.

That is the reason a modestly priced three-wheeler with a wide bar range is usually a better toddler purchase than an expensive one with a narrow range. The child will outgrow the expensive one on the same schedule.

## A note on lights and characters
Lights are a visibility aid and they are genuinely useful at dusk. Characters are decoration. Neither should move a scooter up or down the list, and a scooter chosen mainly for its character is a scooter chosen for the wrong reason.
`,
    zh: `幼儿滑板车市场里，有很多「拍照好看、骑起来很差」的车。而如果知道该读哪四行信息，这个差别在商品页上是看得见的。四行里没有一行是颜色、灯光，或者踏板上的卡通形象。

## 踏板高度决定了要花多大力气
幼儿蹬地的那条腿很短。踏板离地每高一厘米，孩子就要多弯一厘米，而踏板高的车会把蹬地变成蹲起。

最小号滑板车看起来几乎是平的，原因就在这里。那是一个功能性选择，不是造型选择。把踏板高度对着孩子的小腿去比，而不是对着箱子上的年龄：孩子站在车旁边时，踏板应该明显低于膝盖。

## 倾斜转向 vs 会转的车把
多数幼儿滑板车靠倾斜转向。孩子移动重心，前轮跟着走。它在低速时更稳，也教了自行车以后需要的那种平衡。

有些靠转动车把转向。它一开始更好理解，但迁移的东西更少。

两种都能用。要避开的是那种「声称两种都行、其实哪种都不干净」的车把，因为孩子没法建立起一致的预期：自己的手和自己的身体各自在做什么。

## 车把范围是隐藏的寿命
幼儿滑板车能用多久，取决于车把能调多少，而不是踏板有多结实。有三级或四级、并且跨度足够大的车把，能撑过好几个季节。只调两厘米的车把，一年之内就会太低，然后整辆车被换掉，而踏板还是完好的。

要看可调范围的绝对值，也要确认夹紧装置在最高位置仍然咬得住。一个在孩子压上去时会自己往下溜的车把，比固定车把更糟。

## 刹车，再说一次
后挡泥板刹车是标配，而它只有在「孩子双脚站在踏板上、双手扶把」这个姿势下、脚跟够得到挡泥板时才有效。要测这个姿势，不是测金鸡独立那个。

## 重量，以及谁来拎
幼儿拎不动滑板车太久。真正会去拎的是大人，通常一只手，通常还要同时顾着一个孩子。一辆更轻、能折叠的车，比一辆更重、不能折的车更值得买——即使后者的踏板更好。

## 多花的钱买到了什么，没买到什么
在入门之上，钱买到的是轴承品质、更顺的折叠、更好的轮子。它买不到稳定性——那是三轮布局的函数；它也买不到更长的可用期——那是车把范围的函数。

这就是为什么一辆价格适中、车把范围宽的三轮车，通常比一辆昂贵、范围窄的更值得作为幼儿车买。孩子会按同一张时间表把贵的那辆也长过去。

## 关于灯和卡通形象
灯是可见性辅助，在黄昏时确实有用。卡通形象是装饰。两者都不该让一辆车在名单上升或降；而一辆主要因为卡通形象被选中的车，是因为错的理由被选中的。
`,
  },
];

const runOne = (productCategory, articles) =>
  runBatch({
    apiBase: API_BASE,
    productCategory,
    batchLabel: `${BATCH_LABEL}-${productCategory}`,
    articles,
    token: TOKEN,
    apply: APPLY,
    emitSql: EMIT_SQL,
    verify: VERIFY,
  });

// Verify mode exits the process from inside runBatch, so it runs alone and
// first: --verify is a read-only assertion pass and running the second batch
// after the first has exited would never happen.
if (VERIFY) {
  await runOne("electric_car", ECAR_ARTICLES);
} else {
  await runOne("electric_car", ECAR_ARTICLES);
  await runOne("scooter", SCOOTER_ARTICLES);
}