/**
 * R50 — scooter budget, the ride-on-to-scooter rung.
 *
 * WHY THIS IS TWO ARTICLES AND NOT SIX.
 *
 * The plan was to take scooter's three thin combinations (budget, maintenance,
 * scenario, one article each) to three apiece, which needs six new articles.
 * A fresh cover audit says that is impossible right now, and the number matters
 * more than the plan:
 *
 *   - check:covers tolerates a cover shared by at most TWO published guides.
 *   - The scooter catalogue carries 13 products, of which six are ADULT
 *     electric scooters whose photos cannot illustrate a children's scooter.
 *   - That leaves 7 children's scooters plus one helmet photo = 8 covers.
 *   - All 15 published scooter articles are packed onto those 8 covers: seven
 *     of them carry 2 sharers each, and the helmet photo carries 1. Total free
 *     slots inside the scooter set: THREE.
 *
 * Three free slots is the number that matters, and it is not enough. Promoting
 * a combination to the index threshold needs TWO slots spent in the SAME
 * combination, so three slots can promote exactly one combination and no more —
 * promoting two would need four. (The helmet cover's single slot is also the
 * weaker of the three, since a helmet photo illustrates accessories rather than
 * a scooter.) Two of those three slots are the wholly unused cover below.
 *
 * So the batch was re-planned around the cover that was actually free. The
 * audit turned up a product that had been counted as unavailable and is not:
 *
 *   Radio Flyer Scoot 2 Scooter — ages 1-4, four wheels, converts from a
 *   ride-on to a scooter, rear brake, $31.49, 4.6 stars over ~6.9k reviews.
 *   It sits in the `other` category bucket, not `scooters`, which is why the
 *   earlier count missed it, and no published guide uses its image at all.
 *
 * One unused cover = TWO slots = two articles, and in this combination that is
 * enough: budget is at 1, so 1 + 2 = 3 clears COMPOSITE_INDEX_THRESHOLD.
 * maintenance and scenario stay at 1 and stay noindex. That is the honest
 * ceiling of the current image supply, not an editorial choice. Taking those two
 * over the line needs four slots, i.e. TWO more unused children's scooter
 * photos — plus one more to absorb the leftover helmet slot.
 *
 * WHY BUDGET, AND WHY THIS ANGLE.
 *
 * The existing budget article ("Best Scooter Under $50", 250 words) never says
 * ride-on, toddler, seat, or four-wheel — measured, zero occurrences of each.
 * The ride-on-to-scooter rung is the one thing a sub-$50 scooter question gets
 * asked about by parents of two- and three-year-olds, and the site says nothing
 * about it. So these two articles take the youngest rung of the category:
 * what a convertible actually buys you, then what to check once you own one.
 * They are deliberately not another "best of" — there are already five in this
 * category, and the 2026-11 trend reading put preparation and fit questions
 * ahead of listicles for the weeks around Black Friday.
 *
 * GROUNDING RULE (unchanged). No third-party figure, no model weight, no price
 * quoted as a recommendation, no certification claim, no first-person
 * measurement. The copy argues from published-document structure: which line on
 * a spec sheet decides the answer, what a wheel count does and does not promise.
 * assertCopy() in lib/guide-batch.mjs enforces the vocabulary.
 *
 * CONTRACT. Creates 2 NEW records, never edits an existing one, refuses to run
 * if a slug already exists, idempotent on re-run.
 *
 * Usage:
 *   node scripts/fill-guides-scooter-budget-r50.mjs              # dry run
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/fill-guides-scooter-budget-r50.mjs --apply
 *   node scripts/fill-guides-scooter-budget-r50.mjs --sql        # emit a D1 .sql file
 *   node scripts/fill-guides-scooter-budget-r50.mjs --verify     # re-fetch and assert
 */
import { runBatch } from "./lib/guide-batch.mjs";

const APPLY = process.argv.includes("--apply");
const VERIFY = process.argv.includes("--verify");
const EMIT_SQL = process.argv.includes("--sql");
const API_BASE = (process.env.CMS_API_BASE || "https://store.balancebiketoddler.com").replace(/\/+$/, "");
const TOKEN = String(process.env.CMS_ADMIN_ALL_TOKEN || "").trim();

const BATCH_LABEL = "b5-scooter-budget";

// One cover, two articles — the only arrangement check:covers permits here.
// Absolute URL in the same store.balancebiketoddler.com form every other guide
// record uses, so the prerender's normalizeMediaUrl / toAbsoluteMediaUrl see it
// as already-absolute and leave it alone.
const RADIO_FLYER_COVER =
  "https://store.balancebiketoddler.com/kids_push_ride_ons/Radio/Rank_7_ASIN_B01FLACUUQ_Radio%20Flyer%20Scoot%202%20Scooter%20BlueRedPink%20for%20Kids%20A/images/primary.jpg";

const ARTICLES = [
  // ---- scooter / budget (1 -> 3, clears the threshold) ------------------
  {
    slug: "kids-scooter-ride-on-vs-convertible",
    title: "Ride-On or Convertible Scooter",
    description:
      "For a two-year-old the question is not which scooter, but whether a sit-on toy that later becomes a scooter is worth it. What each one actually is.",
    keywords: ["ride on scooter", "convertible scooter", "toddler scooter", "scooter for 2 year old"],
    zhTitle: "骑乘式还是可转换滑板车",
    zhDescription:
      "两岁孩子的真问题不是选哪辆滑板车，而是「先坐着玩、之后能变滑板车」这种值不值得。两种形态各自是什么。",
    zhKeywords: ["骑乘式滑板车", "可转换滑板车", "幼儿滑板车", "两岁滑板车"],
    topic: "budget",
    topicOrder: 51,
    cover: RADIO_FLYER_COVER,
    en: `A two-year-old cannot ride a scooter. They can sit on something with wheels and be pushed, and they can stand on a deck that is low enough that falling off is a short trip. Those are two different toys, and the "convertible" category exists to sell one object that does both.

The question worth answering before you spend anything is whether that two-in-one is a real saving or a compromise that does neither job well.

## What each shape actually is
A ride-on is a seat on wheels with a handle behind it. The child sits, an adult pushes. Nothing about it teaches balance, and nothing about it is a scooter.

A convertible starts in that seated position and later drops or removes the seat so the child stands on the deck and pushes with a foot. The wheels stay. The frame stays. What changes is where the child's weight goes.

That is the whole trick, and it is a legitimate one: the child gets used to the object, the height, and the wheels before being asked to balance on them.

## The spec line that decides it
The number that matters is the deck height, not the age on the box.

A convertible that sits low — close to the ground in scooter mode — lets a small child put a foot down without the scooter leaning far enough to throw them. A convertible that keeps a high deck because the seat mechanism dictates the frame height will hand a toddler a scooter they cannot safely stop.

Look for the deck height relative to the wheel size, and compare it with the child's inseam. If the child has to reach, the scooter will tip every time they take a foot off.

## Where the compromise shows up
Two failure points are common in this price band.

The first is the seat joint. A seat that clips on and off is convenient until the clip loosens, and then the seat rocks while the child is on it. A seat held by four bolts and a plate takes longer to remove and does not develop that rock.

The second is the handlebar. Convertibles often ship one height so that the same bar works behind a seat and in front of a standing child. That single height is usually right for one mode and wrong for the other. An adjustable bar covers both, and a bar that only adjusts over two centimetres covers neither for long.

## What a convertible does not buy you
It does not buy a longer usable life than a scooter bought at the right time. The reasoning is easy to get backwards.

A convertible spends its first year as a ride-on. That is a year the child is not learning to balance, and a year of wear on wheels that were sized for sitting. When the child finally stands on it, the deck is the one the frame was built around, not the one their leg length now calls for.

The honest case for a convertible is not "one purchase instead of two". It is "one object the child is not afraid of". For a child who will not stand on an unfamiliar deck, that is worth paying for. For a child already happy on a low scooter, it is not.

## How to decide in the shop
Three checks, in order.

First, put the child on the seat with shoes on and see whether their feet reach the ground when the seat is at its lowest. A ride-on whose seat is too high is a toy the child will slide off.

Second, take the seat off and put the child on the deck. If the deck is high enough that they cannot touch a foot down while holding the bar, this convertible is not ready for them yet, whatever the age range says.

Third, hold the bar and rock the whole object side to side. Any movement at the seat joint or the folding clamp is the wear you will be living with.

## The short version
A ride-on is a seat. A scooter is a deck. A convertible is a bet that the child will accept the second after getting used to the first, and the bet pays off only when the deck sits low enough for their leg.

If the deck is low and the seat is bolted rather than clipped, the two-in-one is a real object. If either of those is wrong, buy the simpler thing for the age the child actually is, and buy the scooter later when their leg length says so.
`,
    zh: `两岁的孩子骑不了滑板车。他们能坐在带轮子的东西上被推着走，也能站在一块足够低的踏板上——低到摔下来只是一小段距离。这是两种不同的玩具，而「可转换」这个品类存在的意义，就是卖一个能同时做这两件事的东西。

在花钱之前真正值得回答的问题，是这种二合一到底是省了一次购买，还是两件事都没做好。

## 两种形态各自是什么
骑乘式是一把带轮子的座椅，后面有一个推杆。孩子坐着，大人推。它不教任何平衡，它也不是滑板车。

可转换式从那个坐姿开始，之后把座椅降下或拆掉，孩子站在踏板上用脚蹬。轮子还在，车架还在，变的是孩子的重心去了哪里。

这就是全部的机关，而且这个思路是成立的：孩子在被要求「站在上面保持平衡」之前，先熟悉了这个东西本身、这个高度和这些轮子。

## 决定成败的那一行规格
关键数字是**踏板高度**，不是箱子上的年龄。

坐得很低的可转换车（滑板模式下踏板贴近地面），能让孩子伸脚触地时不需要把车压到会把自己甩出去的角度。而因为座椅机构决定了车架高度、因而踏板偏高的可转换车，等于给幼儿一辆他停不下来的滑板车。

要拿踏板高度对着轮径看，再对着孩子的内侧腿长比。如果孩子必须「够」，那么每一次伸脚都会让车倾斜。

## 妥协出现在哪里
这个价位段常见两个失效点。

第一是座椅接口。卡扣式拆装的座椅很方便，直到卡扣松掉——然后孩子坐在上面时座椅会晃。四颗螺栓加一块底板固定的座椅拆起来慢一点，但不会长出那种晃动。

第二是车把。可转换车常常只给一个高度，好让同一根杆子既能用在座椅后面、也能用在站立的孩子前面。那一个高度通常只对其中一种模式正确、对另一种错误。可调车把能覆盖两种；而只调两厘米的车把，两种都盖不住多久。

## 可转换车买不到什么
它买不到比「在对的时机买的滑板车」更长的使用期。这个推理很容易搞反。

可转换车的第一年是骑乘玩具。那是孩子没有在学平衡的一年，也是按「坐着」的受力去设计轮子的一年。等孩子终于站上去时，踏板是车架当初为之设计的那个踏板，而不是他现在的腿长所要求的那个。

为可转换车辩护的诚实理由不是「一次顶两次购买」，而是「一个孩子不害怕的东西」。对一个不肯站上陌生踏板的孩子，这值得付钱；对一个已经能在低踏板上玩得开心的孩子，不值得。

## 在店里怎么判断
三步，按顺序。

第一，让孩子穿鞋坐上座椅，看座椅降到最低时他的脚能不能触地。座椅太高的骑乘玩具，孩子会往下滑。

第二，拆掉座椅，让孩子站上踏板。如果踏板高到他扶着车把也碰不到地，那这辆车现在还不适合他，不管年龄区间怎么写。

第三，扶住车把，把整车左右摇。座椅接口或折叠夹处有任何松动，那就是你以后要一直对付的磨损。

## 一句话版本
骑乘式是一把座椅，滑板车是一块踏板。可转换式是这样一个赌注：孩子先熟悉前者、之后会接受后者。而这个赌注只在踏板足够低、孩子腿够得着的时候才赢。

踏板够低、座椅是螺栓固定而不是卡扣，这个二合一就是一件真东西。这两条有一条不对，就先按孩子现在的年龄买更简单的那个，等腿长够了再买滑板车。
`,
  },
  {
    slug: "kids-scooter-first-year-upkeep",
    title: "A First Scooter's First Year",
    description:
      "What actually wears on a small child's scooter in year one, and which of it decides whether the toy is still safe rather than merely scruffy.",
    keywords: ["toddler scooter maintenance", "first scooter upkeep", "kids scooter care", "scooter wheel wear"],
    zhTitle: "第一辆滑板车的第一年",
    zhDescription:
      "幼儿滑板车在第一年里真正会磨损的是什么，其中哪些决定了玩具是否还安全，而不只是「看起来旧了」。",
    zhKeywords: ["幼儿滑板车保养", "第一辆滑板车", "滑板车维护", "滑板车轮子磨损"],
    topic: "budget",
    topicOrder: 52,
    cover: RADIO_FLYER_COVER,
    en: `A first scooter is bought for a child who weighs little and rides slowly, so it is easy to assume it needs no attention. What wears in year one is not the thing that gets abused. It is the thing that gets adjusted, folded, and left outside.

Four parts account for almost all of it, and only two of them decide whether the scooter is still safe.

## The wheels, and what "worn" means on a plastic wheel
Small scooters run solid plastic or urethane wheels. They do not go flat; they wear a flat spot.

A flat spot appears when the child brakes by dragging a foot or by stomping the rear fender over and over. Once a wheel has a flat, every rotation thumps, the child feels it through the deck, and they stop riding it as much. That is a comfort failure, not a safety one — but it is the failure that ends a toy's life early.

Turn the scooter upside down and spin each wheel. A wheel that stops in the same place every time has a flat. A wheel that wobbles side to side has a bearing or axle problem, which is the safety-relevant one: a seized wheel stops the scooter abruptly and puts the child over the bar.

## The folding clamp, which is the real safety item
On a folding scooter the clamp is the only thing holding the deck to the steering column, and it is the part a child will play with because it is the part that moves.

The check takes ten seconds: fold and unfold it five times, then try to move the deck and the column against each other with the clamp closed. Any rotation or rock means the clamp is not doing its job, and a scooter whose deck can rotate under a standing child will eventually fold at the wrong moment.

Adjust the clamp tension if the design allows it. If it does not, and the joint moves, the scooter is done — this is not a part to nurse along.

## The rear fender brake
The fender is pressed by a heel, so its wear depends on how the child stops, and children stop in the way that feels urgent rather than the way that is gentle.

Look for two things. The fender should still spring back to a clear gap above the wheel; a fender that sags and drags is a brake that is always slightly on, which heats the wheel and teaches the child nothing about control. And the fender should still reach the wheel at all — a fender worn thin at the contact point stops braking before it looks broken.

## The handlebar clamp
The bar is the part that gets adjusted most, because it is how the scooter grows with the child, and every adjustment is a chance for the clamp to be left half tight.

The failure is quiet: the bar slides down under the child's weight while they are riding. Test it by putting the bar at the height you intend to use and pressing down hard on the grips. If it creeps, tighten the clamp; if it still creeps at the specified torque, the clamp has worn out of round and the assembly needs replacing rather than re-tightening.

## What none of this is
None of these checks is a substitute for the manufacturer's stated limits, and none of it is a repair schedule. The point is narrower: four parts, checked in this order, tell you whether the scooter a child is riding tomorrow is the same object that was safe last week.

## The order that matters
Wheels first, because a wobble is the one that hurts. Then the folding clamp, because it is the only joint that can fail while the child is standing on it. Then the fender, then the bar clamp.

The whole pass takes a few minutes and it is worth repeating at the change of every season — the same interval at which the bar gets moved up a notch.
`,
    zh: `第一辆滑板车是买给体重轻、骑得慢的孩子的，所以很容易以为它不需要照看。第一年里真正磨损的，并不是被粗暴对待的部分，而是被反复调整、折叠、丢在户外的部分。

几乎全部磨损都集中在四个零件上，而其中只有两个决定这辆车**还安不安全**。

## 轮子：塑料轮上的「磨坏」是什么意思
小号滑板车多用实心塑料或聚氨酯轮。它们不会爆胎，它们会磨出一个**平面**。

平面来自孩子用脚拖地刹车，或者反复用脚跟去踩后挡泥板。一旦某个轮子有了平面，每转一圈都会「咯噔」一下，孩子会从踏板上感觉到，然后就不太愿意骑了。这是舒适性失效，不是安全性失效——但正是它让一个玩具提前退休。

把车倒过来，逐个转轮子。每次都在同一个位置停下的，有平面。左右晃动的，是轴承或轴的问题，而这个才是和安全相关的：卡死的轮子会让车突然停住，把孩子从车把上甩出去。

## 折叠夹：真正的安全件
在可折叠滑板车上，折叠夹是唯一把踏板和转向柱连住的东西，而它恰好也是孩子会去玩的部分——因为它会动。

检查只要十秒：折叠、展开五次，然后在夹紧状态下试着让踏板和转向柱相对转动。只要有转动或松动，说明这个夹子没在干活；而一辆「孩子站上去时踏板会转」的车，早晚会在错误的时刻折起来。

如果设计允许就调紧张力。如果不允许、而关节仍然在动，这辆车就到此为止了——这不是一个可以凑合着用的零件。

## 后挡泥板刹车
挡泥板是靠脚跟压的，所以它的磨损取决于孩子怎么停，而孩子停车用的是「感觉着急」的方式，不是「感觉温柔」的方式。

看两件事。挡泥板应该还能弹回到轮子上方留出间隙；塌下来一直蹭着轮子的挡泥板，等于刹车一直半踩着，会让轮子发热，也教不会孩子任何控制。另外，挡泥板得还够得着轮子——接触点被磨薄到一定程度时，它会在看起来还没坏的时候就刹不住。

## 车把夹
车把是被调整最多的零件，因为它就是「滑板车随孩子长高」的机构，而每一次调整都是一次「夹子被留在半紧状态」的机会。

这个失效很安静：孩子在骑的时候，车把在他们的体重下自己往下滑。测法是——把车把调到你打算用的高度，然后用力往下压把手。如果它往下爬，就拧紧夹子；如果在规定扭矩下仍然往下爬，说明夹子已经磨得失圆，该换组件而不是继续拧。

## 这些检查不是什么
它们都不是厂商标称限制的替代品，也不是一份维修计划表。它们能回答的问题更窄：这四个零件，按这个顺序查完，能告诉你孩子明天要骑的这辆车，还是上周那辆安全的车吗。

## 顺序是有讲究的
先轮子——晃动那个才会弄伤人。再折叠夹——它是唯一可能在孩子站在上面时失效的关节。然后挡泥板，最后车把夹。

整套检查几分钟就能做完，值得在每一季换季时重复一次——也就是车把往上调一档的那个节奏。
`,
  },
];

await runBatch({
  apiBase: API_BASE,
  productCategory: "scooter",
  batchLabel: BATCH_LABEL,
  articles: ARTICLES,
  token: TOKEN,
  apply: APPLY,
  emitSql: EMIT_SQL,
  verify: VERIFY,
});