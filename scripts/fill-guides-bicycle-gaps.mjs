/**
 * R48 — fill the guides category×topic gaps, batch 3: bicycle.
 *
 * WHY THIS BATCH. Bicycle has ten live published guides and all seven
 * combinations sit below COMPOSITE_INDEX_THRESHOLD (3), so every
 * /guides/bicycle/<topic>/ page exists, is linked, and carries noindex,follow:
 * a URL the site advertises that can never earn an index entry. The gaps, taken
 * from the live set the prerender counts (see runBatch):
 *
 *   /guides/bicycle/beginner/     2 -> needs 1
 *   /guides/bicycle/scenario/     1 -> needs 2
 *   /guides/bicycle/budget/       1 -> needs 2
 *   /guides/bicycle/risk/         1 -> needs 2
 *   /guides/bicycle/special/      2 -> needs 1
 *   /guides/bicycle/maintenance/  1 -> needs 2
 *   /guides/bicycle/best/         2 -> needs 1
 *
 * Eleven articles take all seven to 3 — the first category where the axis goes
 * fully indexable.
 *
 * GROUNDING RULE (unchanged across every batch). The site is an editorial
 * publisher with no laboratory, so this copy states no third-party figure, no
 * model weight, no price, no certification claim, and no first-person
 * measurement. It argues from published-document structure instead: which
 * question a spec sheet answers, which line on a listing is the one that
 * matters, what a standard number does and does not promise. The vocabulary is
 * enforced by assertCopy() in lib/guide-batch.mjs, which is the single
 * implementation for every batch.
 *
 * WHAT THE COPY MAY ASSERT. These are structural facts of the children's-bike
 * category, true by inspection of any listing in this catalogue, and none of
 * them is attributed to a named model: kids' bikes are sold by wheel diameter;
 * they are listed with a stated age or height range; most carry a coaster brake
 * below a certain wheel size and a hand brake above it; a bike with training
 * wheels is not the same vehicle as a balance bike. Where a page needs a number
 * the reader should verify, the copy says where to read it rather than quoting
 * it.
 *
 * CONTRACT. Creates 11 NEW records, never edits an existing one, refuses to run
 * if a slug already exists, idempotent on re-run. Every check lives in
 * lib/guide-batch.mjs.
 *
 * Usage:
 *   node scripts/fill-guides-bicycle-gaps.mjs              # dry run
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/fill-guides-bicycle-gaps.mjs --apply
 *   node scripts/fill-guides-bicycle-gaps.mjs --sql        # emit a D1 .sql file
 *   node scripts/fill-guides-bicycle-gaps.mjs --verify     # re-fetch and assert
 */
import { runBatch } from "./lib/guide-batch.mjs";

const APPLY = process.argv.includes("--apply");
const VERIFY = process.argv.includes("--verify");
const EMIT_SQL = process.argv.includes("--sql");
const API_BASE = (process.env.CMS_API_BASE || "https://store.balancebiketoddler.com").replace(/\/+$/, "");
const TOKEN = String(process.env.CMS_ADMIN_ALL_TOKEN || "").trim();

const PRODUCT_CATEGORY = "bicycle";
const BATCH_LABEL = "b3-bicycle";

const ARTICLES = [
  // ---- bicycle / beginner (2 -> 3) ------------------------------------
  {
    slug: "kids-bike-pedal-start-and-stopping",
    title: "Starting and Stopping a Pedal Bike",
    description:
      "The two skills a new rider needs before distance: pushing off without a wall, and stopping under control. Drills that build both, in order.",
    keywords: ["teaching child to ride bike", "kids bike starting stopping", "child pedal bike first ride", "kids bike braking practice"],
    zhTitle: "儿童自行车起步与刹车：先练这两件事",
    zhDescription:
      "新骑手最先要会的不是骑得远，而是不用墙也能起步、以及有控制地停下来。按顺序练的两个动作。",
    zhKeywords: ["儿童自行车起步", "教孩子骑车", "儿童自行车刹车", "第一次骑自行车"],
    topic: "beginner",
    topicOrder: 21,
    cover: "https://store.balancebiketoddler.com/scrape_store/kids_bikes/Glerc/Rank_Similar_ASIN_B0FWRB5WXT_Glerc Rover Kids Bike 12-18 Inch Boys Bike for 2-9/images/primary.jpg",
    en: `Most first-ride advice is about balance. Balance is not the bottleneck on a pedal bike — starting and stopping are. A child who cannot push off unaided needs an adult's hand at every start, and a child who cannot stop deliberately uses their feet or the nearest hedge. Both skills are teachable in a driveway, in one order.

## Push-off before pedalling
The natural instinct is to put both feet on the pedals and push. That is the hardest possible start: the child has no momentum, both legs are committed, and the bike tips before the first revolution.

The easier sequence, taught on a slight downhill or on flat ground with the seat low enough that both feet reach:

1. Stand astride the bike, both feet flat on the ground.
2. Take one step forward, as if walking.
3. Put the dominant foot on its pedal only after that step.
4. Push the pedal through and sit down.

Step two is the one children skip. Walking the bike forward for a metre gives the momentum that makes the first pedal stroke survivable.

## The low seat is a teaching tool, not a mistake
A bike set up for a confident rider has the saddle high enough that the leg is nearly straight at the bottom of the stroke. That is the right riding position. It is the wrong teaching position, because the child cannot put a foot down.

Lower the saddle until both feet are flat while seated. Ride that way until starting and stopping are automatic, then raise it a centimetre at a time. A bike that is comfortable to pedal but impossible to catch is a bike that gets abandoned.

## Stopping is a separate lesson
Do not teach stopping by riding fast and grabbing the brake. Teach it at walking pace, repeatedly:

- Walk the bike, squeeze the brake, stop. Ten times.
- Ride two metres, squeeze, stop. Ten times.
- Ride five metres, choose a spot, stop at that spot.

The third version is the one that matters, because it turns braking from a reaction into a decision.

Which brake you are teaching depends on the bike. Smaller kids' bikes commonly ship a coaster brake — you stop by pushing the pedals backwards — while larger ones carry a hand brake on the rear wheel. A coaster brake cannot be feathered, so the child stops either fully or not at all; a hand brake can be squeezed progressively, which makes the "stop at that spot" drill possible. Our [coaster versus hand brake comparison](/guides/special/kids-bike-coaster-vs-hand-brake) covers what each type demands of the rider.

## Front brake caution
If the bike has two hand brakes, teach the rear first and treat the front as a second-stage tool. A hard front brake on a small wheel with a light rider pitches the bike forward. This is not a reason to disconnect it — a front brake is the more effective one once understood — but it is a reason to introduce it after the rear is reliable.

## When to raise the seat
When the child can start without a hand on the bike, stop where they intend to, and put one foot down without looking. That is usually a couple of weeks of short sessions, not one long afternoon.

## Further reading
- [Kids bike size chart by age](/guides/beginner/kids-bike-size-chart)
- [First kids bike by age and height](/guides/beginner/kids-bike-first-by-age)
- [Teaching a child to ride](/guides/scenario/kids-bike-teach-to-ride)`,
    zh: `关于第一次骑车的建议，大多在讲平衡。但在带脚踏的自行车上，平衡不是瓶颈——起步和停车才是。不会自己起步的孩子，每一次出发都要大人扶一把；不会主动刹车的孩子，用脚或者最近的树篱来停。这两件事都能在一条车道上按顺序练出来。

## 先学推着走，再学踩踏板
孩子的本能是把两只脚都放上踏板再蹬。这恰恰是最难的起步方式：没有初速度、两条腿都占住了，车还没转满一圈就要倒。

更容易的顺序是这样，在轻微下坡、或者把座垫降到双脚能着地的平地上练：

1. 跨坐在车上，双脚平放在地面。
2. 向前迈一步，像走路那样。
3. 迈完这一步之后，才把惯用脚放上踏板。
4. 把踏板蹬过去，同时坐下去。

第二步是孩子最容易跳过的。让车先往前走一米，这点初速度才让第一脚踩得下去。

## 座垫放低是教学工具，不是装错了
给熟练骑手设置的车，座垫高度要让腿在踩到底时接近伸直。那是正确的骑行姿势，却是错误的教学姿势，因为孩子踩不到地。

把座垫降到坐着时双脚都能平放，一直骑到起步和停车变成习惯，再一厘米一厘米往上抬。一辆踩着舒服、却怎么也踩不到地的车，最后会被闲置。

## 停车是单独一课
不要用「骑快了捏刹车」来教停车。用走路的速度，反复练：

- 推着车走，捏刹车，停。做十次。
- 骑两米，捏刹车，停。做十次。
- 骑五米，自己选一个点，在那个点停下。

第三种才是关键，因为它把刹车从「反应」变成了「决定」。

教哪种刹车，取决于车。较小的儿童车常常配脚刹——往后踩踏板就停——大一些的配后轮手刹。脚刹没法半捏，孩子要么停住要么不停；手刹可以逐渐加力，所以「在指定点停下」这个练习才做得成。两种刹车各自对骑手的要求，见[脚刹与手刹的对比](/guides/special/kids-bike-coaster-vs-hand-brake)。

## 关于前刹
如果车有两个手刹，先教后刹，把前刹当成第二阶段才引入的工具。小轮径加上轻体重，前刹捏重了会把车往前翻。这不是要拆掉前刹——理解之后前刹其实更有效——而是说要在后刹可靠之后才介绍它。

## 什么时候抬高座垫
当孩子能不扶车把起步、想停就停、并且不用低头就能放下一只脚的时候。这通常是几周里若干次短练习的结果，不是一个下午。

## 延伸阅读
- [儿童自行车尺寸表：按年龄](/guides/beginner/kids-bike-size-chart)
- [儿童第一辆自行车：按年龄和身高选](/guides/beginner/kids-bike-first-by-age)
- [教孩子骑车](/guides/scenario/kids-bike-teach-to-ride)`,
  },

  // ---- bicycle / scenario (1 -> 3) ------------------------------------
  {
    slug: "kids-bike-riding-to-school",
    title: "Cycling to School: What to Settle First",
    description:
      "The route, the traffic exposure and the drop-off rules decide this long before the bike does. What to check before a child rides to school alone.",
    keywords: ["child cycling to school", "kids bike school route", "child bike commute safety", "when can child bike to school"],
    zhTitle: "孩子骑车上学：先定下来的三件事",
    zhDescription:
      "路线、车流暴露和接送规则，比自行车本身更早决定这件事。让孩子独自骑车上学之前该确认什么。",
    zhKeywords: ["孩子骑车上学", "儿童自行车上学路线", "骑车上学安全", "几岁能骑车上学"],
    topic: "scenario",
    topicOrder: 22,
    cover: "https://store.balancebiketoddler.com/scrape_store/kids_bikes/RoyalBaby/Rank_Similar_ASIN_B0FKF8NL11_RoyalBaby Kids Mountain Bike for Boys and Girls Ul/images/primary.jpg",
    en: `The decision to let a child cycle to school is usually argued about the child. It should be argued about the route, because the route is the part that does not change when the child does.

## The route has to be walkable first
Before anything else: can an adult walk the route with the child, at school-run time, and describe every junction? If the answer is no, the route is not ready regardless of how good the rider is.

Walk it twice — once at the hour the ride would happen, once at a quiet hour. The difference between those two walks is the entire risk. A road that is empty at ten in the morning and a queue of turning cars at eight-fifteen are the same road on a map and two different places to ride.

## Count the conflict points, not the distance
A short route with four driveways crossing the pavement and one blind corner is worse than a longer route along a straight, low-traffic street. What matters is how many places a moving car can appear from a direction the child is not looking.

Driveways and car parks are the ones adults underweight, because the driver is often reversing and looking for a space rather than for a cyclist. A child on the pavement at a driveway is in a driver's blind spot from the moment the car starts reversing.

## Age is a poor proxy for readiness
There is no age at which cycling to school becomes safe, because the variables are the route, the traffic and the child's attention. What can be observed instead:

- Does the child stop at a kerb without being told, every time?
- Do they look behind before a manoeuvre, or only forward?
- Can they describe what a car's indicator means for them?
- Do they ride in a straight line, or wander while talking?

A child who passes all four on a quiet street can be assessed on a busy one. A child who fails the first cannot, at any age.

## The bicycle has to be the right kind
A school run is short, repetitive and often in poor light. That favours a bike that is easy to start on, has working brakes on both wheels where the size allows, and is visible. Mudguards and a rack matter here more than weight does: a child arriving wet and carrying a bag on their back is a child who stops wanting to ride.

Lights and reflectors are not accessories in this context. Winter school runs happen in the dark in one direction for months.

If the bike is being bought for this, size matters more than specification — a bike the child cannot put a foot down on at a junction is the wrong bike no matter what else it has. The [first-bike selection guide](/guides/beginner/kids-bike-first-by-age) walks through the fit decisions, and the [size chart](/guides/beginner/kids-bike-size-chart) has the numbers to check against.

## Rules that have to be agreed before the first ride
Write them down, because "we discussed it" and "you agreed" are different things at the moment a child is late:

- Which side of the road, and whether the pavement is permitted where you live.
- Where the bike is left, and whether it can be locked there.
- What happens in rain, and who decides.
- The one rule that ends the arrangement: no helmet, no ride.

## The trial period
Ride it together for two weeks before the child rides it alone. Not as supervision in the abstract — as a way to find the specific junction that is worse than it looked from the pavement, and to be present the first time a car pulls out.

## Further reading
- [Teaching a child to ride](/guides/scenario/kids-bike-teach-to-ride)
- [Helmet fit for kids](/guides/risk/kids-bike-helmet-fit)
- [Kids bike under 100](/guides/budget/kids-bike-under-100)`,
    zh: `要不要让孩子骑车上学，讨论通常落在孩子身上。其实应该落在路线上，因为孩子会变，路线不会。

## 先要能走通
在别的之前先问：大人能不能在上下学那个时段，带着孩子走一遍这条路，并且说清每一个路口？如果不能，路线就没准备好，车骑得再好也没用。

走两遍——一遍在真正骑车的那一小时，一遍在清静的时候。这两遍之间的差别，就是全部风险。地图上是同一条路，早上十点空空荡荡，八点一刻一排车在转弯，实际是两个地方。

## 数冲突点，不是数距离
一条短路，如果有四个出入口横穿人行道、还有一个看不见来车的拐角，比一条更长但笔直、车流稀少的路要危险。真正要看的是：有多少地方，车会从孩子没在看的方向冒出来。

车道出入口和停车场是最被低估的，因为那里的司机往往在倒车、在找车位，而不是在看自行车。车一挂倒挡，站在出入口人行道上的孩子就在盲区里。

## 年龄是不好的判断标准
不存在某个年龄骑车上学就安全了，因为变量是路线、车流和孩子的注意力。可以观察的是这些：

- 孩子会不会不用提醒就在路缘停下，每一次都停？
- 变向之前会不会回头，还是只看前面？
- 能不能说清一辆车的转向灯对自己意味着什么？
- 骑的时候走直线，还是一边说话一边歪？

在清静街道上能做到这四条的孩子，可以放到繁忙街道上去评估；第一条就做不到的，什么年龄都不行。

## 车必须是合适的那种
上学路程短、重复、常常光线不好。所以要的是容易起步、在尺寸允许的范围内两轮都有刹车、并且看得见的车。挡泥板和后货架在这里比重量更重要：一个淋湿了、还得背着包的孩子，很快就不想骑了。

在这个场景里，车灯和反光片不是配件。冬天的上学路，有几个月是摸黑去的。

如果这辆车就是为上学买的，尺寸比配置更重要——在路口踩不到地的车，别的再好也是错的车。[第一辆车怎么选](/guides/beginner/kids-bike-first-by-age)讲了适配的判断，[尺寸表](/guides/beginner/kids-bike-size-chart)给了可以对照的数字。

## 第一次骑之前就要定好的规则
写下来，因为「我们说过了」和「你答应了」在孩子快迟到那一刻不是一回事：

- 走哪一侧，当地人行道允不允许骑。
- 车停在哪里，那里能不能上锁。
- 下雨怎么办，谁来决定。
- 一条能终止整个安排的规则：没戴头盔就不骑。

## 试运行
让孩子独自骑之前，先一起骑两周。不是为了抽象的「看着」，而是为了找出那个从人行道上看不出来、实际更糟的路口，以及在第一辆车突然开出来的时候在场。

## 延伸阅读
- [教孩子骑车](/guides/scenario/kids-bike-teach-to-ride)
- [儿童头盔怎么戴才合适](/guides/risk/kids-bike-helmet-fit)
- [百元级儿童自行车](/guides/budget/kids-bike-under-100)`,
  },
  {
    slug: "kids-bike-family-ride-logistics",
    title: "A Family Bike Ride: Planning the Trip",
    description:
      "Group rides fail on logistics, not on fitness. Pace, distance, who carries what, and the one rule that keeps the group together.",
    keywords: ["family bike ride", "family cycling with kids", "group bike ride children", "family bike ride planning"],
    zhTitle: "全家一起骑车：把人凑齐比骑得远更重要",
    zhDescription:
      "集体骑行失败在组织，不在体力。配速、距离、谁带东西，以及让队伍不散的那条规则。",
    zhKeywords: ["全家骑车", "亲子骑行", "带孩子骑行", "家庭骑行计划"],
    topic: "scenario",
    topicOrder: 23,
    cover: "https://store.balancebiketoddler.com/scrape_store/kids_bikes/Glerc/Rank_Similar_ASIN_B0FCYCS2F9_Glerc Kids Bike for Ages 1-8 Years Old 12-16 Inch/images/primary.jpg",
    en: `A ride with children fails for reasons that have nothing to do with cycling ability. It fails because the slowest rider is treated as an exception, because someone is cold, or because the group separates at a junction and half of it keeps going.

## Set the pace from the slowest bike
The pace of a family ride is the pace of its slowest member, and pretending otherwise produces the standard failure: the fast riders surge ahead, stop to wait, get cold, and the ride becomes a series of sprints and shivering.

The practical version is a leader and a sweeper. One adult rides in front and sets a pace the slowest rider can hold while talking — if they cannot talk, it is too fast. One adult rides at the back and never passes anyone. On a three-person ride this is redundant; on anything larger it is the whole organisation.

## Distance is misleading, stops are the real currency
Children measure a ride in stops, not kilometres. A two-kilometre ride with a playground in the middle is a longer, better ride than a five-kilometre loop with no reason to stop. Plan the route around the stops and the distance takes care of itself.

The reverse also holds: a route that is entirely appropriate in distance can fail because there is nowhere to stop when someone needs to.

## Mixed ages need mixed vehicles, decided honestly
A five-year-old on a pedal bike and a three-year-old on a balance bike cannot ride the same two kilometres. Pretending they can is how a family ride becomes a carry.

The honest options, in order of how well they preserve the ride:

- A trailer-cycle or tag-along, which lets a smaller child pedal when they want and be towed when they do not.
- A seat or trailer for the youngest, accepting that the towing adult's pace is now lower.
- A shorter route, with the older children doing a second loop.

The last option is underrated. Two shorter rides, one with everyone and one for the older children, keeps the group intact and the older riders satisfied.

## Who carries what
One adult carries the repair kit, the water and the layers. Handing this to a child guarantees it is left behind. The kit for a family ride is small: a pump, tyre levers, a spare tube in the right size, a multi-tool, and a phone.

Food matters more than adults expect, because hunger in a child presents as complaining about something else entirely.

## The junction rule
The single rule that keeps a group together, and the one children can actually follow: nobody crosses a road alone. The group reforms before every crossing, and the adult decides when.

This has to be stated before the ride and repeated at the first crossing, because the instinct on a bike is to keep moving.

## Bikes have to be checked before the group leaves
A family ride that starts with a flat is a family ride that starts with an argument. The pre-ride check is thirty seconds per bike: tyres firm, brakes biting, nothing loose. The [chain and tyre care guide](/guides/maintenance/kids-bike-chain-tire-care) has the routine, and [sizing](/guides/beginner/kids-bike-size-chart) matters here too — a bike that is too large is the one that falls at the first stop.

## Further reading
- [Teaching a child to ride](/guides/scenario/kids-bike-teach-to-ride)
- [Kids bike chain and tyre care](/guides/maintenance/kids-bike-chain-tire-care)
- [Best 16 inch bike](/guides/best/kids-bike-best-16-inch)`,
    zh: `带孩子骑车，失败的往往不是骑车能力，而是组织：最慢的那个人被当成例外、有人冷了、或者在某个路口队伍断了，一半人继续往前骑。

## 按最慢的那辆车定速
家庭骑行的速度就是最慢那个成员的速度，装作不是，就会出现那种标准结局：快的人冲到前面、停下来等、等着等着就冷了，然后整趟骑行变成一阵冲刺一阵发抖。

实际做法是「领骑＋收尾」：一个大人骑在最前面，把速度定在最慢的人能一边骑一边说话的程度——说不上话就是太快了。另一个大人骑在最后，绝不越过任何人。三个人的骑行不需要这个；再多人，这就是全部的组织。

## 距离会骗人，停靠才是真单位
孩子是用「停几次」来算一趟骑行的，不是用公里。两公里中间有个游乐场，比五公里一圈没理由停，是更长也更好的一趟。

反过来也成立：距离完全合适的路线，也可能因为「有人需要停的时候没地方停」而失败。

## 年龄不同，车就得不同，而且要老实承认
五岁骑脚踏车、三岁骑平衡车，这两个人骑不了同样的两公里。假装可以，一趟家庭骑行就变成了搬运。

老实的选择，按「尽量保住骑行」的顺序：

- 拖挂车或跟随车：小的那个想踩就踩，不想踩就被拖着走。
- 给最小的装座椅或拖车，代价是那个大人的速度现在更慢。
- 路线缩短，大孩子再跑第二圈。

最后一条被低估了。两段短骑行，一段所有人一起，一段只给大孩子，队伍不散，大孩子也骑得过瘾。

## 谁带东西
修理包、水、备用衣物，都由一个大人带。交给孩子，基本等于留在家里。家庭骑行的包很小：打气筒、撬胎棒、对尺寸的内胎、多功能工具、手机。

吃的比大人预想的重要，因为孩子饿了，表现出来的往往是对完全另一件事发牢骚。

## 路口规则
让队伍不散的那一条，而且是孩子真的能做到的：没有大人陪，任何人不过马路。每次过街前队伍先重新集合，什么时候过由大人决定。

这条要在出发前说清楚，在第一个路口再重复一遍，因为骑在车上的本能就是一直往前。

## 出发前先查车
一趟从爆胎开始的家庭骑行，就是从吵架开始的。出发检查每辆车三十秒：胎压足、刹车咬得住、没有松动的地方。[链条与轮胎养护](/guides/maintenance/kids-bike-chain-tire-care)有日常流程；[尺寸](/guides/beginner/kids-bike-size-chart)在这里同样重要——车太大，就是第一站停车时倒下的那辆。

## 延伸阅读
- [教孩子骑车](/guides/scenario/kids-bike-teach-to-ride)
- [儿童自行车链条与轮胎养护](/guides/maintenance/kids-bike-chain-tire-care)
- [16 寸儿童自行车怎么选](/guides/best/kids-bike-best-16-inch)`,
  },

  // ---- bicycle / budget (1 -> 3) --------------------------------------
  {
    slug: "kids-bike-secondhand-buying",
    title: "Second-Hand Kids Bike: What to Check",
    description:
      "A used kids bike is often the smarter purchase. What to inspect, what disqualifies a bike outright, and what a low price usually hides.",
    keywords: ["used kids bike", "second hand kids bike", "buying used childrens bike", "kids bike inspection"],
    zhTitle: "二手儿童自行车怎么挑：值得查的几处",
    zhDescription:
      "二手儿童车往往是更划算的选择。该检查哪里、什么情况直接放弃，以及低价通常藏着什么。",
    zhKeywords: ["二手儿童自行车", "儿童车二手", "买二手自行车", "二手童车检查"],
    topic: "budget",
    topicOrder: 24,
    cover: "https://store.balancebiketoddler.com/scrape_store/kids_bikes/Glerc/Rank_Similar_ASIN_B0DZWZ2LSD_Glerc Petal Girls Bike 12-18 Inch for Ages 2-9 Kid/images/primary.jpg",
    en: `Children outgrow bikes long before they wear them out, which is why the second-hand market for kids' bikes is full of machines with very little use on them. That is the argument for buying used. The counter-argument is that a cheap bike can hide a fault that costs more than the saving — and on a child's bike, a hidden fault is a safety problem rather than an inconvenience.

## The four things that disqualify a bike
Not "need attention" — disqualify. Walk away from:

1. **A cracked or bent frame.** Look at the joints where the tubes meet, especially under the bottom bracket and around the head tube. Paint cracking in a line is a crack.
2. **A bent fork or misaligned wheels.** Stand behind the bike and sight along the frame: the rear wheel should sit centred between the stays, and the front wheel should line up with it. If either is visibly off, the bike has been in an impact.
3. **A seized or badly worn drivetrain.** A chain so stretched it no longer sits in the sprocket teeth will skip under load, and replacing it often means replacing the chainring too.
4. **Missing or broken brake parts.** A brake lever with no cable, or a coaster brake hub that spins freely backwards, is not a bike to ride home.

Everything else is negotiable and repairable.

## What a low price is usually telling you
A bike priced far below its siblings on the same listing site is usually one of four things: it has been stored outside for a season, it is missing a component, it is a size nobody wants, or the seller is not sure what it is.

The first is the most common and the most expensive. A bike stored outdoors has water in the bearings and a rusted chain; both are cheap parts but the labour to fit them can exceed the value of the bike. If the photos show rust on the chain or pitting on the chrome, assume the bearings need attention.

Size is the benign version: a 12-inch bike is plentiful and cheap because children leave that size quickly. That is exactly the size a family should buy used, because it will be outgrown in two years regardless.

## Check the things that are expensive to replace
Tyres, tubes, brake pads, cables and a chain are consumables and cheap. Rims, hubs, cranks, forks and frames are the expensive parts. Inspect in that order of priority:

- Spin each wheel. It should turn smoothly without a wobble, and stop gradually rather than abruptly.
- Rock the cranks side to side. Any play means the bottom bracket bearing is worn.
- Turn the handlebars. Any grinding means the headset bearing needs replacing.
- Squeeze the brake levers. They should move the pads to the rim before the lever reaches the bar.

## Fit cannot be fixed later
The single most important measurement is whether the child can put both feet flat on the ground while seated, or at minimum one foot comfortably. A bike that is too large is not "room to grow" — it is a bike the child cannot stop safely on, which is the [fit question the size chart answers](/guides/beginner/kids-bike-size-chart).

Saddle height can be adjusted; wheel size and frame geometry cannot. That is why the size comes first and the condition second.

## What the saving actually buys
Compare the used price plus the parts you know it needs against the new price. If the used bike needs a chain, a tube and a set of pads, those are a small addition. If it needs wheels or a fork, the saving has already been spent.

For the same money, the [budget new-bike breakdown](/guides/budget/kids-bike-under-100) explains what a cheaper new bike does and does not include, which is the right comparison for a used one.

## Further reading
- [Kids bike under 100](/guides/budget/kids-bike-under-100)
- [Kids bike size chart](/guides/beginner/kids-bike-size-chart)
- [Kids bike chain and tyre care](/guides/maintenance/kids-bike-chain-tire-care)`,
    zh: `孩子的车往往在骑坏之前就已经嫌小了，所以二手儿童车市场上有很多几乎没怎么用过的车。这是买二手的理由。反面的理由是：一辆便宜的车可能藏着比省下的钱更贵的毛病——而在儿童车身上，藏起来的毛病是安全问题，不是不方便。

## 四种情况直接放弃
不是「需要收拾」，是放弃：

1. **车架开裂或变形。** 看管子相接的地方，尤其是五通下方和头管周围。漆面上一条直线的裂纹就是裂纹。
2. **前叉变形或车轮不在一条线上。** 站到车后面顺着车架看：后轮应该在后叉中间，前轮应该和它对齐。任何一处明显偏了，这车撞过。
3. **传动卡死或严重磨损。** 链条拉伸到已经吃不住齿形，受力就会跳齿，换链条往往连牙盘也得换。
4. **刹车零件缺失或损坏。** 没有线管的刹把，或者往后转却空转的脚刹花鼓，不是能骑回家的车。

其他的都可以谈、可以修。

## 低价通常在告诉你什么
一辆明显比同页面其他车便宜的车，通常是四种情况之一：在户外放了一季、少了某个零件、尺寸没人要、或者卖家自己也不清楚这是什么。

第一种最常见也最贵。户外放过的车，轴承里进水、链条生锈，零件都便宜，但装上去的工时可能超过车本身的价值。照片里链条有锈、镀层有点蚀，就按轴承需要处理来估。

尺寸那种算是良性的：12 寸车多且便宜，因为孩子很快就骑过这个尺寸。而这恰恰是家庭最该买二手的尺寸，因为不管怎样两年后就小了。

## 先查换起来贵的东西
轮胎、内胎、刹车皮、线管、链条都是耗材，便宜。轮圈、花鼓、曲柄、前叉、车架才是贵的那部分。按这个优先顺序看：

- 转每个轮子。应该顺滑、不摆，并且是慢慢停而不是骤然停。
- 左右摇曲柄。有旷量就是五通轴承磨了。
- 转车把。有颗粒感就是碗组轴承要换。
- 捏刹把。应该在捏到底之前就把刹车皮压到轮圈上。

## 尺寸没法事后补救
最重要的一项测量是：孩子坐着时双脚能不能平放地面，至少一只脚能不能轻松着地。车太大不是「留着长个子的余地」，是孩子没法安全停下的车——这正是[尺寸表回答的适配问题](/guides/beginner/kids-bike-size-chart)。

座垫高度能调，轮径和车架几何不能调。所以尺寸在先，车况在后。

## 省下的钱到底买了什么
把二手价加上你已知要换的零件，和新车价比。如果只是链条、内胎、一副刹车皮，那是很小的追加；如果要换轮组或前叉，省下的钱已经花完了。

同样的预算，[百元级新车拆解](/guides/budget/kids-bike-under-100)讲了便宜的新车有什么、没有什么，那才是和二手车对比的正确对象。

## 延伸阅读
- [百元级儿童自行车](/guides/budget/kids-bike-under-100)
- [儿童自行车尺寸表](/guides/beginner/kids-bike-size-chart)
- [儿童自行车链条与轮胎养护](/guides/maintenance/kids-bike-chain-tire-care)`,
  },
  {
    slug: "kids-bike-when-to-spend-more",
    title: "When a Kids Bike Is Worth More Money",
    description:
      "Most families overpay on the first bike and underpay on the third. Which upgrades change the ride and which are just a lighter sticker price.",
    keywords: ["kids bike worth the money", "expensive kids bike worth it", "kids bike upgrade", "best value kids bike"],
    zhTitle: "儿童自行车什么时候值得多花钱",
    zhDescription:
      "多数家庭在第一辆车买贵了、在第三辆买便宜了。哪些升级真的改变骑行，哪些只是更贵的标签。",
    zhKeywords: ["儿童自行车值得买贵的", "儿童车升级", "高端儿童自行车", "儿童车性价比"],
    topic: "budget",
    topicOrder: 25,
    cover: "https://store.balancebiketoddler.com/scrape_store/kids_bikes/Glerc/Rank_Similar_ASIN_B0DZWR2QSW_Glerc 20 24 26 Inch Kids Bike Kids Mountain Bike f/images/primary.jpg",
    en: `The conventional advice is that children grow out of bikes, so buy cheap. That advice is right about the first bike and wrong about the third, and getting it backwards is how families end up spending more in total.

## The first bike should be cheap
A child's first pedal bike is a two-year object. It will be dropped, left in the rain, ridden into a wall, and outgrown. The differences between a cheap bike and an expensive one matter least here, because the rider is not yet capable of using them: a light frame does not help someone who cannot start unaided, and good brakes do not help someone who brakes with their feet.

Buy the first bike on fit and on brakes that work. Save the money.

## The third bike is where the money belongs
By the third bike the child rides distance, rides often, and rides fast enough that weight and braking matter. This is the bike that gets used for years rather than seasons, and it is the one where the cheap version is genuinely worse to ride:

- **Weight.** A heavy bike is not just slower; it is harder to start, harder to carry up steps and harder to pick up after a fall. Weight is the single biggest difference money buys on a kids' bike.
- **Brakes.** Better brake hardware means less lever force for the same stopping power, which matters for small hands.
- **Bearings and drivetrain.** A bike with sealed bearings and a freewheel that runs true needs less maintenance and rides better between services.

None of these is a safety feature in the sense of failing catastrophically. All of them are the difference between a bike the child chooses to ride and one they tolerate.

## What is not worth paying for
- **Gears on a child who does not need them.** A geared bike adds a derailleur to maintain and a mechanism to understand. For flat local riding, a single speed is lighter and simpler.
- **Suspension on a bike ridden on pavement.** A cheap suspension fork adds weight and needs servicing. It does nothing on a smooth surface.
- **A brand name on a frame that is otherwise identical.** Compare specification, not badge.
- **Very light weight at the expense of durability.** The lightest frames in this category are built for racing, not for being dropped on a school run.

## The upgrade hierarchy
If money is limited and the bike is otherwise sound, spend in this order:

1. Correct size — the only item that cannot be fixed later.
2. Working brakes on both wheels where the size allows.
3. Weight, in the frame and wheels.
4. Better tyres, which change grip and rolling resistance cheaply.
5. Gears, only if the terrain or distance demands them.

Items two and four are cheap and high-yield. Item three is the expensive one, and it is the one the third bike should be bought for.

## The resale that makes it work
An expensive kids bike holds value in a way a cheap one does not: a well-known light frame sells second-hand for a meaningful fraction of its price, while a heavy unbranded bike sells for very little. Part of the cost of the expensive bike is recoverable — which is the argument for spending there and the argument against spending on the first bike.

## The size question does not go away
No amount of specification fixes a bike that is the wrong size. The [size chart](/guides/beginner/kids-bike-size-chart) is the first thing to check regardless of budget, and the [under-100 breakdown](/guides/budget/kids-bike-under-100) explains precisely what the cheapest tier omits.

## Further reading
- [Kids bike under 100](/guides/budget/kids-bike-under-100)
- [Second-hand kids bike checks](/guides/budget/kids-bike-secondhand-buying)
- [Best 20 inch bike](/guides/best/kids-bike-best-20-inch)`,
    zh: `通常的建议是：孩子很快就长大了，所以买便宜的。这条建议对第一辆车是对的，对第三辆车是错的；把它搞反，是家庭总共花更多钱的原因。

## 第一辆车就该便宜
孩子的第一辆脚踏车，是个寿命两年的东西。会被摔、会被淋、会撞墙、会嫌小。便宜车和贵车之间的差别，在这里最不重要，因为骑手还不具备使用这些差别的能力：车架轻，帮不到一个还不会自己起步的孩子；刹车好，帮不到一个用脚刹车的孩子。

第一辆车按「尺寸合适」和「刹车能用」买。把钱留着。

## 第三辆车才值得花钱
到第三辆车，孩子骑得远、骑得频繁、速度也上来了，重量和刹车开始起作用。这辆车会用上好几年而不是几个季度，也是便宜版本真的难骑的那一辆：

- **重量。** 重车不只是慢，还更难起步、更难搬上台阶、摔倒后更难扶起来。在儿童车上，重量是钱能买到的最大差别。
- **刹车。** 更好的刹车硬件意味着同样的制动力需要更小的握手力，这对小手很重要。
- **轴承与传动。** 密封轴承加上转得正的单速飞轮，维护更少，两次保养之间也更好骑。

这些都不是「会突然失效」意义上的安全配置，但它们决定孩子是主动想骑，还是勉强骑。

## 不值得付钱的部分
- **给不需要的孩子配变速。** 变速车多一个要维护的后拨、多一套要理解的机构。城区平地骑，单速更轻也更简单。
- **在铺装路面骑的车配避震。** 便宜的避震前叉增加重量、需要保养，在平整路面上什么也不做。
- **只有牌子不同、车架一样的车。** 比配置，不比标。
- **用耐用度换极轻。** 这个类别里最轻的车架是为竞赛做的，不是为在放学路上被摔做的。

## 升级的先后顺序
如果预算有限、车本身又没毛病，按这个顺序花钱：

1. 正确的尺寸——唯一事后补不回来的。
2. 在尺寸允许范围内，两轮都有能用的刹车。
3. 重量，车架和轮组。
4. 更好的轮胎，花不多的钱就能改变抓地和滚阻。
5. 变速，只有在地形或距离确实需要时才加。

第 2 和第 4 项便宜且见效快；第 3 项贵，而那正是第三辆车该为之花钱的东西。

## 二手残值让这笔账成立
贵的儿童车保值方式不一样：一辆有名气的轻车架，二手能卖出价格的相当一部分；一辆重的无名车几乎卖不出钱。贵车的一部分成本是可以回收的——这既是「在那里花钱」的理由，也是「别在第一辆上花钱」的理由。

## 尺寸问题不会消失
再好的配置也救不回尺寸不对的车。不管预算多少，[尺寸表](/guides/beginner/kids-bike-size-chart)都是第一件要查的事；[百元级拆解](/guides/budget/kids-bike-under-100)则讲清了最低一档到底省掉了什么。

## 延伸阅读
- [百元级儿童自行车](/guides/budget/kids-bike-under-100)
- [二手儿童自行车怎么挑](/guides/budget/kids-bike-secondhand-buying)
- [20 寸儿童自行车怎么选](/guides/best/kids-bike-best-20-inch)`,
  },

  // ---- bicycle / risk (1 -> 3) ----------------------------------------
  {
    slug: "kids-bike-lights-and-visibility",
    title: "Lights and Visibility on a Child's Bike",
    description:
      "Reflectors are not lights and lights are not enough. What actually makes a child visible at dusk, and the reflector rules that already apply.",
    keywords: ["kids bike lights", "child bike visibility", "kids bike reflectors", "bike lights for children"],
    zhTitle: "儿童车的灯与可见度：反光片不等于灯",
    zhDescription:
      "反光片不是灯，有灯也不等于看得见。黄昏时真正让孩子被看见的是什么，以及本来就适用的反光配置要求。",
    zhKeywords: ["儿童自行车车灯", "儿童车可见度", "自行车反光片", "儿童车灯"],
    topic: "risk",
    topicOrder: 26,
    cover: "https://store.balancebiketoddler.com/scrape_store/kids_bikes/vollsch/Rank_Similar_ASIN_B0DCZ11TCR_vollsch BMX Style 12 14 16 Inch Kids Bike Training/images/primary.jpg",
    en: `Visibility is the most misunderstood part of children's bike safety, because the vocabulary blurs three different things: being lit, being reflective, and being seen.

## Reflectors and lights do different jobs
A reflector has no light source. It returns light that arrives at it, which means it works only when something is already shining at the bike — a car's headlights, a streetlamp. It does nothing in the moment before a driver looks, and nothing at all to a driver approaching from behind a parked car who has not yet switched on their lights.

A light emits. It is visible to a driver who is not looking for it, which is the case that matters.

New bikes sold in the United States are required to come with a specific set of reflectors — front, rear, pedal and wheel — as a condition of sale. Those reflectors satisfy a product-safety requirement. They do not make a child visible in the way a parent assumes when they see them.

## The failure mode is the angle, not the brightness
Most child bike lights are bright enough. The problem is where they point. A light mounted on the handlebar points where the bike is going, which is useful for the rider seeing the path and nearly useless for being seen by a car pulling out of a side road — that driver is looking sideways across the junction, not down the road.

A rear light is the more important of the two for being seen, because a child is overtaken far more often than they meet oncoming traffic, and an overtaking driver has the shortest reaction window.

## What to fit, in order
1. **A rear light**, steady or flashing, mounted where it is not hidden by a coat or a bag.
2. **A front light**, mounted low enough that it is not above a driver's eyeline, and angled slightly down.
3. **Reflectors kept in place** — including the wheel reflectors, which are what make a child visible from the side at a junction.
4. **High-visibility clothing** on the upper body, because it is the part above the saddle that a driver sees first over a parked car.

Items one and three together cover the two approach directions that matter. Item four is not a substitute for either.

## The helmet problem
A helmet is not a visibility device, and a dark helmet on a dark-haired child against a dark car interior is close to invisible. If the helmet is dark, a light or a reflective band on the back of it is the cheapest visibility improvement available — and it is at the height a driver actually looks.

## Batteries are the real maintenance issue
A dead light is worse than no light, because the family believes the child is visible. Rechargeable lights that live on the bike are the arrangement that survives a school run; removable ones end up in a drawer.

Check them on the same schedule as the brakes. The [pre-ride routine](/guides/maintenance/kids-bike-chain-tire-care) is thirty seconds and it should include "both lights on".

## Where the bike is ridden decides how much this matters
A child riding on a pavement in daylight needs almost none of this. A child riding on a road at dusk, or on a shared path where cars cross, needs all of it. The [riding-to-school guide](/guides/scenario/kids-bike-riding-to-school) sets out how to judge that exposure, and [helmet fit](/guides/risk/kids-bike-helmet-fit) covers the head-protection half of the same decision.

## Further reading
- [Helmet fit for kids](/guides/risk/kids-bike-helmet-fit)
- [Riding to school](/guides/scenario/kids-bike-riding-to-school)
- [Kids bike chain and tyre care](/guides/maintenance/kids-bike-chain-tire-care)`,
    zh: `可见度是儿童车安全里最容易被误解的一环，因为有三个不同的概念被混在一起说：被点亮、会反光、以及被看见。

## 反光片和灯干的是两件事
反光片本身不发光。它把照到它身上的光反射回去，也就是说，只有在已经有光照到车上的时候才有用——车灯、路灯。在司机还没看向这边的那一刻，它什么也不做；对从停着的车后面开过来、还没开灯的司机，它也什么都做不了。

灯是主动发光的。它能让一个没在找自行车的司机看见，而那才是有意义的情形。

在美国销售的新自行车，按规定必须随车配一套特定反光片——前面、后面、脚踏和车轮——这是销售条件。这些反光片满足的是产品安全要求，并不能达到家长看到它们时以为的那种「被看见」。

## 失效点在角度，不在亮度
大多数儿童车灯亮度是够的。问题在它照哪儿。装在车把上的灯，指向车要去的地方，这对骑手看清路有用，对「被从侧路开出来的车看见」几乎没用——那个司机在看横向，不在看远处。

就「被看见」而言，后灯比前灯更重要，因为孩子被超越的次数远多于迎面相遇，而超车的司机反应窗口最短。

## 按顺序装什么
1. **后灯**，常亮或闪烁，装在不会被外套或背包挡住的位置。
2. **前灯**，装低一点，不要高过司机的视线，并略微朝下。
3. **保留原有反光片**——包括车轮反光片，那是在路口让孩子从侧面被看见的东西。
4. **上半身的高可见度衣物**，因为越过停放车辆时，司机最先看到的是座垫以上那部分。

第 1 和第 3 项合起来覆盖了两个真正重要的接近方向。第 4 项不能替代其中任何一个。

## 头盔的问题
头盔不是可见度装置。深色头盔、深色头发、深色车厢，几乎是看不见的。如果头盔是深色的，在它背面加一个灯或一条反光带，是能买到的最便宜的可见度改善——而那正好在司机真正会看的高度上。

## 电池才是真正的维护问题
不亮的灯比没有灯更糟，因为家里人会以为孩子是可见的。随车充电、固定在车上的灯，是能撑过上学路的安排；能拆下来的那种，最后都躺在抽屉里。

按和刹车同样的周期检查。出发前的流程只要三十秒，其中应该包括「两个灯都亮」。

## 骑在哪儿，决定这事有多重要
白天在人行道上骑的孩子，几乎不需要这些。黄昏在公路上骑、或者在汽车会横穿共用道的路上骑的孩子，全都需要。[骑车上学](/guides/scenario/kids-bike-riding-to-school)讲了怎么判断这种暴露程度，[头盔适配](/guides/risk/kids-bike-helmet-fit)讲了同一个决定里关于头部防护的那一半。

## 延伸阅读
- [儿童头盔怎么戴才合适](/guides/risk/kids-bike-helmet-fit)
- [孩子骑车上学](/guides/scenario/kids-bike-riding-to-school)
- [儿童自行车链条与轮胎养护](/guides/maintenance/kids-bike-chain-tire-care)`,
  },
  {
    slug: "kids-bike-falls-and-first-response",
    title: "After a Child Falls Off a Bike",
    description:
      "Most falls are nothing. The decisions that matter in the first ten minutes, what to inspect on the child, and when a bike should not be ridden again.",
    keywords: ["child falls off bike", "kids bike fall what to do", "child bike crash", "kids bike safety after fall"],
    zhTitle: "孩子从自行车上摔下来之后",
    zhDescription:
      "大多数摔倒没什么。头十分钟里真正重要的判断、该检查孩子哪里，以及什么情况下这辆车不该再骑。",
    zhKeywords: ["孩子摔倒", "儿童自行车摔车", "孩子摔了怎么办", "摔车后检查"],
    topic: "risk",
    topicOrder: 27,
    cover: "https://store.balancebiketoddler.com/scrape_store/kids_bikes/Glerc/Rank_Similar_ASIN_B0BY8VG1FP_Glerc Fantacy Kids Bike 12-20 Inch Children Bicycl/images/primary.jpg",
    en: `Almost every child who rides will fall, and almost every fall is a bruise and a dented confidence. The problem is that the two categories of fall — the ordinary and the one that needs a doctor — look similar for the first few seconds, and the decisions taken then set the tone for how the child feels about the bike for months.

## First, do not rush
The instinct is to grab the child and stand them up. Wait a moment and watch what they do. A child who is winded will cry and then recover; a child with a head injury may be quiet, or may stand up and then be unsteady in a way that is not obvious while they are being held.

The specific things to observe in the first minute:

- Did they lose consciousness, even briefly?
- Are they confused about where they are or what happened?
- Did they vomit?
- Is the unsteadiness in the legs, or is the whole body unsteady?
- Do they complain of a headache, or of blurred or double vision?

Any of these, after a fall that involved the head, means medical assessment rather than a sticking plaster. Head injuries in children can present hours later and the deterioration can be quick — that is the reason a suspected head injury is treated as urgent even when the child seems fine.

## The helmet is single-use
This is the part families get wrong most often. A helmet that has taken an impact has done its job by absorbing energy, and the material that absorbed it does not recover. A cracked shell is obviously finished; a helmet with no visible damage after a real impact is also finished, because the damage is in the foam.

Replace it. A helmet bought for one fall is cheaper than the alternative, and the replacement decision should not be influenced by how good the helmet looks.

The [helmet fit guide](/guides/risk/kids-bike-helmet-fit) covers what "fit" means, which also determines whether the helmet stayed on the head at all — a loose helmet often comes off in the fall it was supposed to protect against.

## Check the child systematically
After the head question is settled, work through the body in a fixed order, because a child will report the sorest thing and not the worst thing:

- Hands and wrists, which take the impact when a child puts their arms out.
- Elbows and knees, the usual contact points.
- Collarbone, which is the most commonly broken bone in a bicycle fall in children and is often described as "my shoulder hurts".
- Hips, and then the abdomen if the handlebar was involved.

## Then check the bike, in this order
A bike that fell may be fine, or may have a bent fork, a twisted handlebar or a brake that no longer reaches the rim.

1. Sight along the frame from behind: are the wheels in line?
2. Turn the handlebars: did they move relative to the front wheel?
3. Squeeze both brakes: do they still bite?
4. Spin each wheel: is anything rubbing?

A twisted handlebar is the most common post-fall fault and the most dangerous one, because the child steers with the bars and the wheel goes a different way. It is also the easiest to fix, with the stem bolts.

## The confidence problem
A child who falls and is then told to get straight back on often stops riding the thing that hurt them, quietly, over the following weeks. The reliable pattern is to stop the session, deal with the injury and the bike, and come back the next day to the same spot. Returning to the place where it happened is what stops the place from becoming the thing to avoid.

If the fall happened at a specific feature — a kerb, a slope, a corner — ride it again slowly with the child, on foot first. That is the whole of the confidence repair.

## Further reading
- [Helmet fit for kids](/guides/risk/kids-bike-helmet-fit)
- [Kids bike lights and visibility](/guides/risk/kids-bike-lights-and-visibility)
- [Teaching a child to ride](/guides/scenario/kids-bike-teach-to-ride)`,
    zh: `几乎每个骑车的孩子都会摔，而几乎每一次摔倒，结果都是一块淤青加一点受挫的信心。麻烦在于：普通的一摔和需要看医生的那一摔，头几秒钟长得差不多，而那时的处理方式，会决定孩子之后好几个月对这辆车的感受。

## 先别急着扶
本能是冲过去把孩子拉起来。先等一下，看他做什么。岔了气的孩子会哭，然后缓过来；头部受伤的孩子可能很安静，也可能站起来之后站不稳——而被人扶着的时候，这种不稳是看不出来的。

头一分钟要看的，是这几件具体的事：

- 有没有哪怕一瞬间失去意识？
- 对「自己在哪、发生了什么」是否糊涂？
- 有没有呕吐？
- 不稳是在腿上，还是整个身体都不稳？
- 有没有说头痛，或者看东西模糊、重影？

只要摔倒时头部受过冲击，出现其中任何一条，就该去做医学评估，而不是贴个创可贴。儿童头部损伤有时几小时后才表现出来，而恶化可以很快——这就是为什么疑似头部受伤即使孩子看起来没事也要按急症处理。

## 头盔是一次性的
这是家庭最常搞错的地方。受过冲击的头盔已经通过吸能完成了它的工作，而吸掉能量的材料不会恢复。外壳裂了当然报废；一次真实冲击之后外观完好的头盔一样报废，因为损伤在泡沫里。

换掉它。为一个跟头换一顶头盔，比另一种选择便宜，而且换不换不该取决于头盔看起来多新。

[头盔适配](/guides/risk/kids-bike-helmet-fit)讲了「合适」是什么意思，这也决定了头盔在那次本该保护它的摔倒里到底有没有留在头上——松的头盔常常在摔倒时就掉了。

## 按顺序检查孩子
头部的问题定下来之后，按固定顺序过一遍身体，因为孩子会说最疼的地方，而不是最要紧的地方：

- 手和手腕——孩子伸手撑地时承受冲击的地方。
- 肘和膝——最常见的接触点。
- 锁骨——儿童骑车摔倒里最常骨折的骨头，而且常被说成「我肩膀疼」。
- 髋部；如果撞到了车把，再看腹部。

## 然后按这个顺序查车
摔过的车可能没事，也可能前叉弯了、车把歪了、刹车捏不到轮圈上。

1. 从车后顺着车架看：两个轮子在同一条线上吗？
2. 转车把：它相对前轮有没有转动过？
3. 捏两个刹车：还咬得住吗？
4. 转每个轮子：有没有东西在蹭？

车把歪是最常见的摔后故障，也是最危险的，因为孩子用把转向、轮子却往另一个方向去。它同时也是最容易修的，松开立管螺丝即可。

## 信心的问题
摔完就让孩子马上再骑上去，往往不会让他不怕，而是让他在接下来几周里悄悄放弃那个弄疼他的东西。可靠的做法是：结束当次练习，处理好伤和车，第二天回到同一个地点。回到事发的那块地方，才不会让那块地方变成要躲的东西。

如果是在某个具体的地方摔的——一个路缘、一个坡、一个弯——那就先走路、再慢慢地带孩子骑过去一遍。信心的修补，就是这件事的全部。

## 延伸阅读
- [儿童头盔怎么戴才合适](/guides/risk/kids-bike-helmet-fit)
- [儿童车的灯与可见度](/guides/risk/kids-bike-lights-and-visibility)
- [教孩子骑车](/guides/scenario/kids-bike-teach-to-ride)`,
  },

  // ---- bicycle / special (2 -> 3) -------------------------------------
  {
    slug: "kids-bike-for-a-child-with-low-tone",
    title: "A Bike for a Child With Low Muscle Tone",
    description:
      "When balance and strength come later than the birthday suggests, the bike that helps is not the smallest one. What to prioritise instead.",
    keywords: ["kids bike low muscle tone", "bike for hypotonia child", "adaptive kids bike", "kids bike balance support"],
    zhTitle: "肌张力偏低的孩子怎么选车",
    zhDescription:
      "当平衡和力量来得比生日更晚时，有帮助的不是最小的那辆车。该优先看什么。",
    zhKeywords: ["肌张力低儿童自行车", "儿童肌张力低", "平衡辅助童车", "特殊需求儿童车"],
    topic: "special",
    topicOrder: 28,
    cover: "https://store.balancebiketoddler.com/scrape_store/kids_bikes/Glerc/Rank_Similar_ASIN_B0BCDBWMXM_Glerc Maggie Girls Bike 12-20 Inch Kids Bike for 2/images/primary.jpg",
    en: `A child whose balance and strength develop later than their age suggests is not a child who needs a smaller bike. They need a bike that gives them more ways to recover, and that is a different specification.

This page describes the features that help. It is not medical advice, and a physiotherapist or occupational therapist who knows the child is the right person to say whether a particular bike is appropriate.

## Stability before size
A balance bike is usually the better starting point, and for a reason that has nothing to do with age: the child can put both feet flat on the ground at any moment, which means every wobble has an immediate correction available. On a pedal bike with pedals fitted, the same wobble has no correction until the child learns to break the habit of keeping feet on the pedals.

If the child is already past the balance stage, a pedal bike with the pedals removed — a convertible — gives the same property for a while.

## Weight matters more here than anywhere else
A child with low tone who has to hold up a heavy bike is using the strength they need for steering and pedalling on the bike's weight instead. Light is the single most useful specification, and it is worth trading other features for.

This is the one place in the category where paying more for weight is straightforwardly the right decision. The ["when to spend more" breakdown](/guides/budget/kids-bike-when-to-spend-more) explains which upgrades are real, and weight is the first of them.

## Brakes that work with small hands
A brake that needs a strong grip is a brake that is not used. Two things help:

- **Short-reach levers.** Many kids' bikes have levers designed for an adult hand span; some can be adjusted in reach with a screw.
- **A coaster brake as a fallback.** Pushing back on the pedals requires leg strength and no fine motor control, which is often available when a hand brake is not.

A bike with both — a coaster brake and an adjustable-reach hand brake — gives the child two independent ways to stop, which is the point.

## Wide tyres, low gearing
Wide, softer tyres roll over small obstacles instead of catching on them, and need less balance correction for the same surface. Lower gearing makes each pedal stroke easier, which matters when strength is the limiting factor.

Both are specification differences that can be read off a listing before purchase.

## The things to avoid
- **Bikes that are too large "to grow into".** These put the centre of gravity higher and put the feet further from the ground. Both make recovery harder.
- **Narrow racing tyres.** They demand more balance correction on anything but smooth pavement.
- **Clipless pedals or toe straps.** A foot that cannot be removed quickly is a foot that cannot catch a fall.
- **Very low handlebars.** A more upright riding position gives more room to react and puts less weight on the arms.

## What to check on the first ride
Set the saddle low enough that both feet reach the ground while seated, and leave it there longer than the age-based chart would suggest. The [size chart](/guides/beginner/kids-bike-size-chart) is a starting point, not the answer, when tone or confidence is the constraint.

Short, frequent sessions work better than long ones: fatigue is what turns a good session into a fall, and the confidence cost of a fall at the end of a session is out of proportion to its cause.

## Further reading
- [When a kids bike is worth more money](/guides/budget/kids-bike-when-to-spend-more)
- [Kids bike size chart](/guides/beginner/kids-bike-size-chart)
- [Coaster vs hand brake](/guides/special/kids-bike-coaster-vs-hand-brake)`,
    zh: `平衡和力量发育得比年龄慢的孩子，需要的不是一辆更小的车。他们需要一辆「有更多方式可以救回来」的车，那是另一套规格。

这一页讲的是有帮助的那些特征，不是医疗建议。孩子适不适合某辆具体的车，应该由了解这个孩子的康复治疗师或作业治疗师来判断。

## 稳，比小更重要
平衡车通常是更好的起点，理由和年龄无关：孩子在任何一刻都能把双脚平放到地上，也就是每一次歪都有立刻纠正的机会。而装上踏板的自行车，同样的歪在学会「不把脚一直踩在踏板上」之前没有纠正手段。

如果孩子已经过了平衡阶段，一辆拆掉踏板的两用车，能在一段时间里给出同样的性质。

## 重量在这里比在任何地方都重要
肌张力偏低的孩子，如果还得撑住一辆重车，他本该用在转向和踩踏上的力气，就花在撑车重上了。轻，是最有用的一项规格，值得用别的特征去换。

这也是这个类别里唯一一处「为重量多花钱」理所当然正确的地方。[什么时候值得多花钱](/guides/budget/kids-bike-when-to-spend-more)讲了哪些升级是真的，其中第一项就是重量。

## 小手能够得着的刹车
需要很大握力才捏得动的刹车，等于没有被使用。有两点有用：

- **短距刹把。** 很多儿童车装的是按成人手幅设计的刹把；有些可以通过螺丝调整握距。
- **脚刹作为备用。** 往后踩踏板需要腿部力量、不需要精细动作，往往在手刹还不行的时候已经做得到。

同时具备两种——脚刹，加上可调握距的手刹——孩子就有两条各自独立的停车途径，这正是重点。

## 宽胎、低齿比
宽而软的轮胎会碾过小障碍而不是卡在上面，同样的路面需要更少的平衡纠正。齿比更低，每一脚都更省力，在「力量是瓶颈」的时候这一点很关键。

两者都是买之前就能从商品页读出来的规格差异。

## 要避开的
- **「留着长个子」的过大车。** 重心更高、脚离地更远，两样都让救回来更难。
- **窄的竞速胎。** 除了平整路面，任何路面上都要更多的平衡纠正。
- **锁踏或脚套。** 脚不能迅速脱出的装置，等于脚不能去撑住一次摔倒。
- **很低的车把。** 更直立的骑姿留给反应的空间更大，压在手臂上的重量更少。

## 第一次骑要确认的
把座垫降到坐着时双脚都能着地，并且比按年龄的表格建议的更久地保持这个高度。当制约条件是肌张力或信心时，[尺寸表](/guides/beginner/kids-bike-size-chart)是起点而不是答案。

短而频繁的练习，比长的更好：疲劳才会把一次好的练习变成一次摔倒，而练习末尾那一摔对信心的代价，和它的起因完全不成比例。

## 延伸阅读
- [儿童自行车什么时候值得多花钱](/guides/budget/kids-bike-when-to-spend-more)
- [儿童自行车尺寸表](/guides/beginner/kids-bike-size-chart)
- [脚刹与手刹的对比](/guides/special/kids-bike-coaster-vs-hand-brake)`,
  },

  // ---- bicycle / maintenance (1 -> 3) ---------------------------------
  {
    slug: "kids-bike-brake-pad-and-cable-service",
    title: "Brake Pads and Cables: A Service Guide",
    description:
      "Brakes that need the lever pulled to the bar are not brakes. How to judge pad wear, when to replace a cable, and the adjustment that restores bite.",
    keywords: ["kids bike brake adjustment", "kids bike brake pads", "bicycle brake cable replacement", "childrens bike brakes"],
    zhTitle: "儿童自行车刹车皮与线管：保养指南",
    zhDescription:
      "要捏到底才停的刹车，等于没有刹车。怎么判断刹车皮磨损、什么时候该换线管，以及恢复咬合力的调整。",
    zhKeywords: ["儿童自行车刹车调整", "儿童车刹车皮", "自行车刹车线更换", "儿童车刹车保养"],
    topic: "maintenance",
    topicOrder: 29,
    cover: "https://store.balancebiketoddler.com/scrape_store/kids_bikes/Bixike/Rank_Similar_ASIN_B0B8MNBC5J_Bixike Girls Bike with Basket for Toddlers and Kid/images/primary.jpg",
    en: `A brake that needs the lever pulled almost to the handlebar is a brake the child cannot use in an emergency, because the hand strength required goes up exactly when it is needed most. This is the most common fault on a used kids' bike and one of the easiest to fix.

## The lever test
With the bike stationary, pull the brake lever. The pads should contact the rim — or, on a disc brake, the rotor — before the lever has travelled about a third of its range. If the lever reaches the bar, the brake has one of three problems: worn pads, a stretched cable, or a cable that is not adjusted.

Press the lever and hold it. It should feel firm. A lever that can be pulled further with effort indicates a cable that is stretching under load or a housing that is compressing.

## Judging pad wear
Rim brake pads have a wear indicator — a groove or a line moulded into the pad. When the groove is gone, the pad is done. Two further signs:

- The pad has worn so the metal holder is close to the rim. If the holder touches the rim, it will score the braking surface, and a scored rim needs replacing.
- The pad has worn unevenly, which means it is not aligned to the rim. Realigning it is part of the same job as replacing it.

Replacing pads is a cheap, tool-light job: most need one hex key or a spanner. Do both wheels at the same time, because pads wear at similar rates and a mismatched pair is how one brake ends up pulling differently from the other.

## The cable
A brake cable is a consumable. It stretches with use, and the housing it runs through compresses and collects grit. Signs it needs attention:

- The lever has become noticeably spongier over a few weeks.
- The cable is frayed where it enters the lever or the brake.
- The cable is rusty, which means it is dragging inside the housing.

A frayed cable must be replaced, not trimmed. Fraying happens where the cable bends, and a trimmed cable frays again at the same point.

Replacing a cable is the one job on this page that needs the brake re-set afterwards, so do it when you have time to adjust the brake properly rather than in the ten minutes before a ride.

## Adjustment is not the same as repair
If the pads are good and the cable is sound, the brake may simply be out of adjustment. Two adjusters do most of the work:

- The barrel adjuster at the lever or the brake, which takes up cable slack in small increments.
- The pad mounting bolts, which set the pad's angle and distance from the rim.

Turn the barrel adjuster out to take up slack; if it is already near the end of its thread, the cable has stretched beyond what the adjuster can absorb and should be replaced.

## Coaster brakes need a different check
A coaster brake — the kind where you pedal backwards to stop — has no cable and no pad you can see. The check is behavioural: lift the rear wheel, spin it, and push the pedals backwards. The wheel should stop firmly and immediately. If it stops gradually, or if the pedals can be pushed backwards freely without resistance, the hub needs service, and that is a job for a bike shop rather than a driveway.

## How often
Check the lever feel before every ride — it takes three seconds and it is part of the [pre-ride routine](/guides/maintenance/kids-bike-chain-tire-care). Inspect pads monthly, or every few weeks on a bike ridden daily in wet conditions, because wet grit wears pads much faster.

The [coaster versus hand brake guide](/guides/special/kids-bike-coaster-vs-hand-brake) explains which system a given bike is likely to have, if you are not sure what you are looking at.

## Further reading
- [Kids bike chain and tyre care](/guides/maintenance/kids-bike-chain-tire-care)
- [Coaster vs hand brake](/guides/special/kids-bike-coaster-vs-hand-brake)
- [After a child falls off a bike](/guides/risk/kids-bike-falls-and-first-response)`,
    zh: `要捏到几乎贴着车把才停的刹车，是孩子在紧急时刻用不了的刹车——因为最需要它的时候，正好是需要的手劲最大的时候。这是二手儿童车上最常见的毛病，也是最容易修好的之一。

## 捏一把就知道
车停着，捏刹车。刹车皮应该在刹把行程走过大约三分之一之前就贴上轮圈（碟刹则是贴上碟片）。如果刹把能一直捏到车把，这刹车有三种问题之一：刹车皮磨了、线管拉长了、或者线没调。

捏住不放。手感应该是硬的。如果用力还能继续往里捏，说明线在受力下在拉伸，或者线管在压缩。

## 判断刹车皮磨损
圈刹的刹车皮上有磨损标记——一道槽或一条线。槽磨没了，就该换了。另外两个迹象：

- 刹车皮磨到金属座已经贴近轮圈。金属座一旦蹭到轮圈，就会把刹车面刮伤，刮伤的轮圈要换。
- 磨损不均匀，说明它和轮圈没对齐。换的时候顺手一起对齐。

换刹车皮便宜、工具也少：多数只需要一把内六角或扳手。两个轮子一起换，因为磨损速度相近，一边新一边旧，正是两个刹车手感不一样的原因。

## 线管
刹车线是耗材。用久会拉长，外面的线管会压缩、会进灰。该处理的迹象：

- 几周之内刹把明显变软。
- 线在进刹把或进刹车的位置已经散开。
- 线生锈了，说明它在线管里拖着走。

散开的线必须整根换，不能剪。散开就发生在线弯折的地方，剪短之后还会在同一个点再散。

换线是这一页里唯一需要事后重新调刹车的活，所以要挑有时间好好调的时候做，不是出门前那十分钟。

## 调整不等于修理
如果刹车皮是好的、线也是好的，可能只是没调到位。主要靠两处：

- 刹把或刹车上的微调螺丝，以小增量吃掉线的余量。
- 刹车皮固定螺丝，决定皮的角度和离轮圈的距离。

把微调螺丝往外旋可以吃掉余量；如果它已经快到螺纹尽头，说明线拉长到超出微调能吸收的范围，该换线了。

## 脚刹要另一种检查
脚刹——往后踩踏板来停的那种——没有线，也没有能看见的刹车皮。检查靠行为：抬起后轮，转起来，然后往后踩踏板。轮子应该干脆、立刻停住。如果是慢慢停，或者踏板能毫无阻力地往后转，花鼓需要保养，那不是车道上的活，要去车店。

## 多久一次
每次骑之前捏一把——三秒钟，属于[出发前流程](/guides/maintenance/kids-bike-chain-tire-care)的一部分。刹车皮每月看一次；在湿滑环境下每天骑的车，几周看一次，因为湿的砂砾磨皮快得多。

如果拿不准眼前这套是哪种刹车，[脚刹与手刹的对比](/guides/special/kids-bike-coaster-vs-hand-brake)讲了某一辆车更可能配哪一种。

## 延伸阅读
- [儿童自行车链条与轮胎养护](/guides/maintenance/kids-bike-chain-tire-care)
- [脚刹与手刹的对比](/guides/special/kids-bike-coaster-vs-hand-brake)
- [孩子从自行车上摔下来之后](/guides/risk/kids-bike-falls-and-first-response)`,
  },
  {
    slug: "kids-bike-storage-and-winter-layup",
    title: "Storing a Kids Bike Over Winter",
    description:
      "A bike put away wet comes out as a bike that needs parts. The storage routine that prevents a spring rebuild, and what to check when it comes back out.",
    keywords: ["kids bike storage", "winter bike storage kids", "storing childrens bike", "bike layup maintenance"],
    zhTitle: "儿童自行车怎么存放：过冬与长期闲置",
    zhDescription:
      "湿着收起来的车，拿出来时就是一辆要换零件的车。能省掉春天大修的存放流程，以及拿出来时该查什么。",
    zhKeywords: ["儿童自行车存放", "冬季自行车存放", "童车收纳", "长期闲置保养"],
    topic: "maintenance",
    topicOrder: 30,
    cover: "https://store.balancebiketoddler.com/scrape_store/kids_bikes/JOYSTAR/Rank_Similar_ASIN_B086W6286W_JOYSTAR Whizz Kids Bike 12-20 Inch Kids Bicycle fo/images/primary.jpg",
    en: `Most of the damage a kids' bike accumulates happens while it is not being ridden. A bike stored dry and upright lasts years; the same bike stored damp and lying on its side needs a chain, a set of bearings and possibly wheels by the following spring.

## The single rule: dry and upright
Water in the bearings is the expensive failure. It gets in through the headset, the bottom bracket and the wheel hubs, and once inside it corrodes the bearing surfaces. A bike leaning against a wall in a damp shed collects condensation on every cold night.

Two habits prevent almost all of it:

- Store the bike upright, on its wheels or hanging by the frame — not lying on its side, which pools water in the low bearing.
- Store it dry. If it came home wet, dry the chain and the rims before putting it away, which takes a minute with a rag.

## Before a long gap
A bike that will not be ridden for months benefits from four small jobs:

1. **Clean and lube the chain.** A dry chain rusts; a dirty chain holds moisture against the metal.
2. **Inflate the tyres to the low end of the sidewall range.** A tyre left soft for months can take a set at the contact patch, and a flat-spotted tyre rides badly afterwards.
3. **Check the brakes work.** Storing a bike with a dragging brake means the pad sits against the rim for months.
4. **Loosen nothing, tighten nothing** — but do check that the seat post and stem are not seized, which is much easier to deal with now than in spring.

## What not to do
- **Do not hang a bike by one wheel for months.** The wheel takes a load it was not designed for.
- **Do not leave it in direct sun.** Tyres and saddle covers degrade, and the brake pads harden.
- **Do not store it against a damp external wall**, which is the worst of both worlds: cold and wet.

## Bringing it back out
The first ride of the season should start with a full check rather than a pump of the tyres:

- Spin each wheel: free and true, no rubbing.
- Squeeze the brakes: still firm, still stopping at the rim.
- Rock the cranks: no play in the bottom bracket.
- Turn the bars: smooth, no grinding from the headset.
- Check the chain: if it is stiff or rusty, it needs lube before it needs anything else.

A bike that fails the crank or headset test has water in a bearing, and that is the outcome the storage routine exists to prevent.

## The size conversation happens here too
A bike that has been stored for a winter is a bike the child may have outgrown. Measure before the first ride rather than after the first fall: the [size chart](/guides/beginner/kids-bike-size-chart) is the reference, and the saddle can usually be raised a little if the frame is still right.

If the bike has been outgrown, [buying the next one second-hand](/guides/budget/kids-bike-secondhand-buying) is the sensible move — a stored bike in good condition is exactly what the used market rewards.

## Further reading
- [Kids bike chain and tyre care](/guides/maintenance/kids-bike-chain-tire-care)
- [Brake pads and cables](/guides/maintenance/kids-bike-brake-pad-and-cable-service)
- [Second-hand kids bike checks](/guides/budget/kids-bike-secondhand-buying)`,
    zh: `儿童车积累的损伤，多数发生在没在骑的时候。干燥、立着放的车能用好几年；同一辆车如果潮着、侧躺着放，到明年春天就需要一根链条、一套轴承，可能还要换轮组。

## 唯一一条规则：干燥、立着
轴承进水是那种很贵的故障。水从头管、五通和轮毂进去，进去之后就开始腐蚀轴承面。靠在潮湿棚子里墙上的车，每个冷夜都在表面结露。

两个习惯能挡掉几乎全部：

- 立着放，靠两个轮子或者吊住车架——不要侧躺，侧躺会让水积在低处的轴承里。
- 干燥着放。湿着回家的，先把链条和轮圈擦干再收，一块布一分钟的事。

## 长期不用之前
几个月不骑的车，做四件小事就够了：

1. **清链条并上油。** 干链条会锈，脏链条会把水分按在金属上。
2. **把胎打到侧壁上标的下限。** 长期偏软的胎会在接地处定型，之后骑起来一顿一顿的。
3. **确认刹车不蹭。** 收车时刹车在蹭，意味着刹车皮贴着轮圈放好几个月。
4. **别松也别紧任何螺丝**——但要确认座管和立管没咬死，现在处理比春天容易得多。

## 不要做的
- **不要长期单轮悬挂。** 轮子会承受它并非为此设计的载荷。
- **不要放在直射阳光下。** 轮胎和座垫会老化，刹车皮会变硬。
- **不要靠在外墙的潮气面上**，那是两头都占：又冷又湿。

## 拿出来的时候
当季第一次骑，应该从一次完整检查开始，而不是只打个气：

- 转每个轮子：顺、正、不蹭。
- 捏刹车：还是硬的，还是停在轮圈上。
- 摇曲柄：五通没有旷量。
- 转车把：顺滑，头管没有颗粒感。
- 看链条：发僵或生锈，先上油，别的一概先不谈。

曲柄或头管这一项不过，就是有轴承进水了，而那正是这套存放流程要避免的结果。

## 尺寸这件事也在这里发生
放了一冬天的车，孩子可能已经骑不了了。第一次骑之前就量，而不是第一次摔之后：参照[尺寸表](/guides/beginner/kids-bike-size-chart)；如果车架还合适，座垫通常还能往上抬一点。

如果确实小了，[下一辆买二手](/guides/budget/kids-bike-secondhand-buying)是聪明的做法——保养得好、放过一冬的车，正是二手市场最认可的。

## 延伸阅读
- [儿童自行车链条与轮胎养护](/guides/maintenance/kids-bike-chain-tire-care)
- [刹车皮与线管保养](/guides/maintenance/kids-bike-brake-pad-and-cable-service)
- [二手儿童自行车怎么挑](/guides/budget/kids-bike-secondhand-buying)`,
  },

  // ---- bicycle / best (2 -> 3) ----------------------------------------
  {
    slug: "best-kids-bike-for-4-year-olds",
    title: "Best Kids Bike for a 4-Year-Old",
    description:
      "At four the question is whether to buy a pedal bike at all. What the size evidence says, and the two specifications that decide the purchase.",
    keywords: ["best kids bike for 4 year old", "4 year old bike", "kids bike age 4", "first pedal bike 4 years"],
    zhTitle: "4 岁孩子的最佳自行车",
    zhDescription:
      "四岁时真正的问题是要不要买脚踏车。尺寸证据怎么说，以及决定这次购买的两项规格。",
    zhKeywords: ["4 岁儿童自行车", "四岁自行车", "4岁平衡车还是自行车", "第一辆脚踏车"],
    topic: "best",
    topicOrder: 31,
    cover: "https://store.balancebiketoddler.com/scrape_store/kids_bikes/JOYSTAR/Rank_Similar_ASIN_B085Y6PV6R_JOYSTAR Pluto 12 14 16 18 20 Inch Kids Bike with L/images/primary.jpg",
    en: `Four is the age at which the children's-bike market starts offering pedal bikes, and the age at which most families buy one. Both of those are facts about retail, not about children. What actually decides the purchase is inseam length and whether the child has already learned to balance.

## The real question: pedal bike or balance bike
A four-year-old who has ridden a balance bike for a year usually has the balance half of cycling already. For that child, a pedal bike with the saddle set low is a small step: they can coast, they can steer, and the only new skill is pushing the pedals.

A four-year-old who has not ridden a balance bike is being asked to learn balance and pedalling at the same time. That is a harder task, and it is why some four-year-olds take to a pedal bike in an afternoon and others take a season.

If the child has not balanced yet, the cheaper and often faster route is a balance bike first — which is why the [first-bike guide](/guides/beginner/kids-bike-first-by-age) treats the decision as a sequence rather than a purchase.

## Size: the number to check
Children's bikes are sold by wheel diameter, and 12-inch and 14-inch wheels are the range that fits most four-year-olds. The number that actually decides, though, is inseam: the child should be able to sit on the saddle with both feet flat on the ground, or on the balls of both feet.

Wheel size and inseam are related but not identical, because frame geometry differs between models. A 12-inch bike with a low standover height fits a shorter child than a 12-inch bike with a tall one.

The [size chart](/guides/beginner/kids-bike-size-chart) has the inseam-to-wheel range. Measure the child rather than the birthday.

## The two specifications that decide it
For a four-year-old, almost everything else is secondary to these:

**1. Brakes that a four-year-old can operate.** Below a certain wheel size, most kids' bikes ship with a coaster brake — you stop by pushing the pedals backwards. That is appropriate: it needs leg strength, which a four-year-old has, and no fine motor control, which a four-year-old is still developing. A hand brake on a small bike should have a short reach, and if it is the only brake, check that the child can actually squeeze it.

**2. Weight.** A four-year-old weighs around a sixth of an adult, and a heavy bike is a much larger fraction of their body weight than it would be of an adult's. A light bike is easier to start, to pick up, and to keep upright at a standstill.

## What to ignore at this age
- **Gears.** A four-year-old does not need them, and a derailleur is one more thing to break.
- **Suspension.** Dead weight on pavement.
- **Number of gears on the marketing copy.** Irrelevant to a child riding to the end of the street.
- **"Grows with the child" frames.** Seat posts and handlebars adjust a few centimetres, not a wheel size. A bike that claims to last from four to eight is a compromise at both ends.

## What the bike will actually be used for
Most four-year-olds ride short distances on pavement, in a driveway, or in a park. That favours a simple, light, single-speed bike with a coaster brake and a low standover height — a specification that is also the cheapest to buy and the easiest to sell on.

The [under-100 guide](/guides/budget/kids-bike-under-100) covers what that tier does and does not include, which is the right starting point for a bike that will be outgrown in two years.

## Further reading
- [First kids bike by age and height](/guides/beginner/kids-bike-first-by-age)
- [Kids bike size chart](/guides/beginner/kids-bike-size-chart)
- [Kids bike under 100](/guides/budget/kids-bike-under-100)`,
    zh: `四岁，是童车市场开始供应脚踏车的年龄，也是多数家庭真正去买一辆的年龄。这两件事都是零售的事实，不是孩子的事实。真正决定这次购买的，是内缝长度，以及孩子有没有已经学会平衡。

## 真正的问题：脚踏车还是平衡车
骑了一年平衡车的四岁孩子，通常已经具备骑车所需的一半：平衡。对这个孩子来说，把座垫放低的脚踏车只是一小步——能滑、能转向，唯一的新技能是踩踏板。

没骑过平衡车的四岁孩子，是在被要求同时学平衡和踩踏。这更难，也正是为什么有些四岁孩子一个下午就上手，有些要一整个季节。

如果孩子还没会平衡，更便宜、通常也更快的路径是先骑平衡车——这也是[第一辆车指南](/guides/beginner/kids-bike-first-by-age)把这件事当成一个顺序、而不是一次购买的原因。

## 尺寸：要查的那个数
儿童车按轮径卖，12 寸和 14 寸是多数四岁孩子合适的范围。但真正决定的是内缝：孩子坐在座垫上时，双脚能平放地面，或者至少前脚掌都能着地。

轮径和内缝相关但不相同，因为不同车型的车架几何不一样。同样 12 寸，跨点低的那辆能骑更矮的孩子。

[尺寸表](/guides/beginner/kids-bike-size-chart)给了内缝到轮径的对应范围。量孩子，别数生日。

## 真正决定的两项规格
对四岁孩子来说，其他大多次要：

**1. 四岁孩子操作得了的刹车。** 在一定轮径以下，多数儿童车配脚刹——往后踩踏板就停。这很合适：它需要腿部力量，四岁孩子有；不需要精细动作，而四岁孩子还在发育这个。小车上如果配手刹，握距要短；如果那是唯一的刹车，要确认孩子真的捏得动。

**2. 重量。** 四岁孩子的体重大约是成人的六分之一，一辆重车占他体重的比例，远比占成人比例大得多。轻车更容易起步、更容易扶起来、静止时也更容易撑住。

## 这个年龄可以忽略的
- **变速。** 四岁孩子不需要，而后拨只是多一个会坏的东西。
- **避震。** 铺装路面上的纯负重。
- **宣传页上的速别数字。** 和骑到街尾这件事无关。
- **「能跟着孩子长」的车架。** 座管和车把能调几厘米，调不了一个轮径。声称能从四岁用到八岁的车，两头都是妥协。

## 这辆车实际会被用来做什么
多数四岁孩子是在人行道、车道、公园里骑很短的距离。这更适合一辆简单、轻、单速、带脚刹、跨点低的车——这套规格同时也最便宜、最好转手。

[百元级指南](/guides/budget/kids-bike-under-100)讲了这一档有什么、没有什么，这是为一辆两年后就要嫌小的车做决定时正确的起点。

## 延伸阅读
- [儿童第一辆自行车：按年龄和身高选](/guides/beginner/kids-bike-first-by-age)
- [儿童自行车尺寸表](/guides/beginner/kids-bike-size-chart)
- [百元级儿童自行车](/guides/budget/kids-bike-under-100)`,
  },
];

runBatch({
  apiBase: API_BASE,
  productCategory: PRODUCT_CATEGORY,
  batchLabel: BATCH_LABEL,
  articles: ARTICLES,
  token: TOKEN,
  apply: APPLY,
  emitSql: EMIT_SQL,
  verify: VERIFY,
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});