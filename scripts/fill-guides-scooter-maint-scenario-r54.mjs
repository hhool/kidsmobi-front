/**
 * R54 — scooter maintenance + scenario, the two combinations still under 3.
 *
 * WHY THIS BATCH EXISTS AT ALL, AFTER R50 SAID THE SUPPLY WAS EXHAUSTED.
 *
 * R50 concluded that scooter maintenance and scenario could not be promoted
 * because there were only three free cover slots, and that those three plus one
 * unused photo were the entire remaining supply. The second half of that was
 * wrong, and the correction is the reason this batch is possible:
 *
 *   The store product pages publish alt_1.jpg .. alt_9.jpg alongside
 *   primary.jpg. The scraper only ever captured primary.jpg into
 *   productImageUrls / galleryUrls / featureImageUrls (all four fields are
 *   byte-identical on every one of the 197 products), so the CMS looked like it
 *   held one image per product. The alts were never in the CMS at all — they
 *   are on the origin, served 200, and in the same 1500x1500 format as primary.
 *
 * R50's probe missed them because it guessed the file names (`secondary.jpg`,
 * `1.jpg`, `images/1.jpg`) instead of reading the product page. Every one of
 * the seven children's scooter products returns NINE alts; the Radio Flyer and
 * the helmet return none. That is 63 usable covers, of which zero are in use.
 *
 * So the real constraint here is not images. It is this: four articles, four
 * distinct covers, at most two sharers each. This batch spends four covers that
 * no published guide has touched.
 *
 * WHY FOUR ARTICLES AND NOT TWO.
 *
 * COMPOSITE_INDEX_THRESHOLD is 3. maintenance is at 1 and scenario is at 1
 * (measured against the live snapshot, counting only non-retired records whose
 * taxonomy.productCategory is "scooter" — NOT the top-level `category` field,
 * which holds the topic). Each combination therefore needs TWO more, not one:
 * 1 + 1 = 2 still renders noindex. Four articles is the minimum, and it lands
 * both at 3.
 *
 * WHY THESE FOUR ANGLE-CONSISTENT TITLES.
 *
 * The two existing articles in these combinations are narrow: "Fix a Wobbly
 * Scooter Wheel" (one symptom) and "Best Kick Scooter 6-8 to School" (one
 * route). Neither covers storage, the steering column, or riding in the wet,
 * which are the three maintenance questions this category actually gets, nor
 * the pavement/school-run surface question. The four below take those, and they
 * cross-link each other rather than repeating a listicle.
 *
 * COVER PAIRING IS SEMANTIC, NOT ARBITRARY. Each cover is a white-background
 * shot whose subject matches its article:
 *
 *   gotrax_8  — full scooter, upright, clean white. Column/neck article.
 *   wayplus_9 — the same scooter folded, twice, no text. Storage article.
 *   hurtle_8  — rider standing on deck, convertible seat visible. Wet/winter.
 *   jetson_9  — side profile, LED deck lit. School-run visibility article.
 *
 * GROUNDING RULE (unchanged, enforced by assertCopy): no third-party figure, no
 * model weight, no price quoted as a recommendation, no certification claim, no
 * first-person measurement. Copy argues from published-document structure.
 *
 * CONTRACT. Creates 4 NEW records, never edits an existing one, skips slugs
 * that already exist, idempotent on re-run.
 *
 * Usage:
 *   node scripts/fill-guides-scooter-maint-scenario-r54.mjs            # dry run
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/fill-guides-scooter-maint-scenario-r54.mjs --apply
 *   node scripts/fill-guides-scooter-maint-scenario-r54.mjs --verify  # re-fetch and assert
 */
import { runBatch } from "./lib/guide-batch.mjs";

const APPLY = process.argv.includes("--apply");
const VERIFY = process.argv.includes("--verify");
const EMIT_SQL = process.argv.includes("--sql");
const API_BASE = (process.env.CMS_API_BASE || "https://store.balancebiketoddler.com").replace(/\/+$/, "");
const TOKEN = String(process.env.CMS_ADMIN_ALL_TOKEN || "").trim();

const BATCH_LABEL = "b6-scooter-maint-scenario";

const STORE = "https://store.balancebiketoddler.com";
const cover = (dir, file) => `${STORE}/${dir.split("/").map(encodeURIComponent).join("/")}/images/${file}`;

// Four distinct covers, none currently used by any published guide. Absolute
// store URLs in the same form every other guide record uses, so the prerender's
// normalizeMediaUrl / toAbsoluteMediaUrl see them as already absolute.
const GOTRAX_NECK = cover(
  "scooters/Gotrax/Rank_1_ASIN_B0CCYMV1T1_Gotrax KS1 Kids Kick Scooter LED Lighted Wheels an",
  "alt_8.jpg",
);
const WAYPLUS_FOLDED = cover(
  "scooters/WAYPLUS/Rank_9_ASIN_B09ZY6M8XH_WAYPLUS KS1 Kick Scooter for Ages 6Kid Teens  Adul",
  "alt_9.jpg",
);
const HURTLE_RIDER = cover(
  "scooters/Hurtle/Rank_4_ASIN_B07VY9Q95Q_Hurtle 3-Wheeled Scooter for Kids - Wheel LED Ligh",
  "alt_8.jpg",
);
const JETSON_PROFILE = cover(
  "scooters/Jetson/Rank_13_ASIN_B08ZCM11J6_Jetson Jupiter Kids 2-Wheel Light-Up Kick Scooter",
  "alt_9.jpg",
);

const ARTICLES = [
  // ---- scooter / maintenance (1 -> 3, clears the threshold) --------------
  {
    slug: "kids-scooter-steering-column-wobble",
    title: "Scooter Steering Column and Headset",
    description:
      "A wobbly scooter can come from the wheel, the axle, or the steering column. How to tell which one you are looking at before you tighten anything.",
    keywords: ["scooter steering column", "scooter headset wobble", "kids scooter loose handlebar", "scooter stem play"],
    zhTitle: "滑板车转向柱与碗组",
    zhDescription:
      "滑板车晃，可能来自轮子、车轴，也可能来自转向柱。先把是哪一处搞清楚，再决定拧哪里。",
    zhKeywords: ["滑板车转向柱", "滑板车碗组松动", "儿童滑板车车把松", "滑板车立杆晃动"],
    topic: "maintenance",
    topicOrder: 53,
    cover: GOTRAX_NECK,
    en: `"My scooter wobbles" is the single most common description of a broken scooter, and it covers at least three different faults. Tightening the wrong one is how a small problem becomes a scooter that steers badly.

The three are the wheel, the axle, and the steering column. They feel similar under a child's foot and they are fixed in completely different places.

## Why the column is the one people miss
The wheel is obvious: you can see it move. The column is hidden inside the joint where the deck meets the upright, and on most children's scooters that joint is a stack of a clamp, a bearing race, and a compression nut rather than a single bolt.

When that stack comes loose the symptom does not look like a loose part at first. The scooter still rolls. What changes is that the front wheel points slightly to one side while the bar is straight, so the child corrects constantly without knowing why, and the scooter feels unpredictable at low speed — exactly when a beginner is least able to correct it.

## The test that separates the three
Put the scooter on a flat surface and hold the deck down with one hand. Turn the bar slowly left and right through its full range.

If the bar turns smoothly but the front wheel lags behind, or arrives at a different angle than the bar, the play is in the column. If the wheel moves with the bar but the whole assembly shifts up and down when you lift the bar, the play is in the headset preload. If the wheel itself rocks side to side on its own axis while the bar stays still, that is the axle.

Only the first two are column problems, and they are fixed by different adjustments.

## The order to adjust in
Loosen the clamp that holds the column height before touching anything else. On a scooter where the bar telescopes, the height clamp squeezes the same tube the headset preload acts on, and adjusting preload with the height clamp tight will fight it. Free the tube, set the preload, then re-clamp the height.

If the design has a compression nut on top of the column, a quarter turn is a lot. The correct preload is the least tension that removes the play — the point where the bar turns freely with no side-to-side rock. Overtightening does not just make steering stiff; it loads the bearing race unevenly and the play comes back worse within a few weeks.

If there is no adjustment at all and the column still moves, the bearing race is worn or the clamp has gone out of round. That is a replacement, not an adjustment.

## What not to do
Do not solve a column wobble by tightening the wheel axle. It is the nearest bolt, it feels like progress, and it does nothing for play that is above the fork. Worse, an over-tightened axle preloads the wheel bearings and turns a smooth roll into a dragging one, which a small child experiences as the scooter being "too slow" rather than as a fault.

## When it is no longer a maintenance question
Play in the column is worth checking before every season change, because that is when the height clamp gets moved and re-tightened by hand. The pass takes a minute.

But there is a line. If the column moves enough that the deck and the upright visibly change angle relative to each other while a child stands on it, the scooter should come out of service until the joint is repaired. A scooter that can fold or twist under a standing child is the one failure mode in this whole category that leads to a fall rather than an annoyance.

If your wobble turns out to be at the wheel instead, that is a different article — [a wobbly wheel](/guides/maintenance/kids-scooter-fix-wobbly-wheel) has its own causes and its own checks.
`,
    zh: `「我的滑板车晃」是所有滑板车故障描述里最常见的一句，而它至少覆盖三种不同的毛病。拧错地方，就是让一个小问题变成一辆转向不对劲的车。

这三种是：轮子、车轴、转向柱。它们在孩子脚下感觉相似，但要在完全不同的位置修。

## 转向柱为什么最容易被漏掉
轮子很明显——你看得见它在动。转向柱藏在踏板和立杆连接的那个关节里面，而在多数儿童滑板车上，那个关节不是一颗螺栓，而是一叠东西：一个夹子、一个轴承碗、一个压紧螺母。

这一叠松掉时，症状一开始并不像「零件松了」。车还是能滚。变的是：车把是直的，但前轮略微偏向一边，于是孩子一直在无意识地修正，却不知道为什么；低速时车变得难以预测——而那正是初学者最没能力修正的时候。

## 把三者分开的那个测试
把车放在平地上，一只手压住踏板。慢慢把车把从左到右转满整个行程。

如果车把转得很顺、但前轮滞后，或者停下的角度和车把不一致，间隙在转向柱。如果轮子跟着车把走，但抬起车把时整个组件上下窜动，间隙在碗组预紧。如果车把不动、而轮子绕自己的轴左右晃，那是车轴。

只有前两种是转向柱问题，而且它们要用不同的调整来修。

## 调整的顺序
在动任何东西之前，先松开固定立杆高度的那个夹子。在车把可伸缩的车上，高度夹夹住的正是碗组预紧所作用的同一根管；在高度夹拧紧的状态下调整预紧，两者会互相打架。先让管子自由，再设预紧，最后重新夹紧高度。

如果设计上转向柱顶端有一个压紧螺母，四分之一圈就是很大的量。正确的预紧是「刚好消除间隙」的最小张力——车把能自由转动、且没有左右晃的那个点。过度拧紧不只是让转向变沉：它会让轴承碗受力不均，几周内间隙会以更糟的形式回来。

如果根本没有可调结构、而柱子仍然在动，那就是轴承碗磨损或夹子失圆了。这是更换，不是调整。

## 不要做什么
不要用拧紧车轴的办法去解决转向柱晃动。它是离得最近的那颗螺栓，拧起来很有「有进展」的感觉，但对前叉以上的间隙毫无作用。更糟的是，过度拧紧车轴会给轮子轴承加预紧，把顺畅的滚动变成拖滞——而小孩对这件事的体验是「这车太慢了」，不是一个故障。

## 什么时候它不再是保养问题
转向柱间隙值得在每次换季前查一次，因为那正是高度夹会被手动移动、再手动拧紧的时候。整套动作一分钟。

但有一条界线。如果孩子站在上面时，踏板和立杆的相对角度能看到明显变化，这辆车就应该停用，直到关节修好。一辆能在孩子站立时折叠或扭转的车，是这个品类里唯一会导致摔倒而不只是让人烦的失效方式。

如果你查出来晃动其实在轮子上，那是另一篇文章——[轮子晃动](/guides/maintenance/kids-scooter-fix-wobbly-wheel)有它自己的原因和检查方法。
`,
  },
  {
    slug: "kids-scooter-winter-storage",
    title: "Storing a Kids Scooter for Winter",
    description:
      "Cold and damp do less damage to a scooter than the way it is put away. What actually fails over a winter, and the ten minutes that prevent it.",
    keywords: ["scooter winter storage", "store kids scooter", "scooter rust prevention", "scooter off season"],
    zhTitle: "儿童滑板车的冬季存放",
    zhDescription:
      "寒冷和潮湿对滑板车的伤害，比不上「收起来的方式」。一个冬天里真正会坏的是什么，以及那十分钟怎么花。",
    zhKeywords: ["滑板车冬季存放", "儿童滑板车收纳", "滑板车防锈", "滑板车过季保养"],
    topic: "maintenance",
    topicOrder: 54,
    cover: WAYPLUS_FOLDED,
    en: `A scooter parked for a winter does not wear out. It seizes, it flats, and it grows a wobble — and all three happen because of where it was left, not because of the cold.

The good news is that the damage is almost entirely preventable, and the work is front-loaded: ten minutes in autumn, nothing until spring.

## What actually fails over a winter
Three things, in order of how often they end a scooter's life.

**Bearings.** Water gets into a wheel bearing and stays there. It does not need to freeze to cause damage; it needs to sit. Over weeks, moisture in a shielded bearing displaces the grease and the bearing corrodes in place. The scooter is not obviously broken in spring — it just rolls badly, and a parent reads that as the child having outgrown it.

**Tyres and wheels with a flat spot.** A polyurethane wheel left loaded in one position for months takes a set. This matters most on scooters stored standing up, where the whole weight of the deck rests on two contact points.

**The folding clamp.** A clamp left closed under tension for months is a clamp whose spring or cam stays compressed. It is the part that decides whether the scooter is safe to ride, and it is the part that degrades purely from being parked.

## Clean before you store, not after
The instinct is to put it away as it is and deal with it in spring. That is backwards: whatever is on the scooter in autumn spends the winter working on it.

Wipe the deck and the underside, then dry the wheels and the fork area specifically. Grit left on a deck holds moisture against the surface. Mud left around an axle sits directly on the seal.

Do not hose the scooter down. Water pushed at a bearing seal is the exact failure above. A damp cloth and a dry one is the whole method.

## Store it lying down, wheels off the load
The single highest-value change is to take the weight off the wheels.

This is where a scooter and a bicycle genuinely differ, and the bicycle article on this site says the opposite for good reason. A bicycle is stored upright on its wheels because its tyres are pneumatic and its rims are large: standing a bicycle loads nothing that takes a set, and hanging a bicycle by one wheel loads the other. A scooter's wheels are solid polyurethane a few centimetres across, so the same instruction would create the exact flat spot it avoids on a bike.

Lying flat on its side is fine for a folding scooter and removes the flat-spot risk entirely. Hanging it by the bar is also fine if the hook holds the bar rather than the deck. What is not fine is standing it upright on its wheels for four months, which is exactly how a scooter gets put in a garage corner.

If it must stand, alternate which end bears the weight every few weeks, or rest it on a block so the wheels are off the floor.

## Leave the clamp OPEN
This is the counterintuitive one. A folding clamp stored closed is stored compressed, and the spring that gives the clamp its snap is the thing that fails.

Fold the scooter open — deck and column at riding angle, clamp released — and store it that way if there is room. If there is not, at least leave the clamp lever unlatched so the mechanism is not under load.

## The height clamp and the column
Drop the bar to its lowest setting before storing. A telescoped column left extended for months holds the height clamp compressed and puts the most leverage on the joint; lowering it removes both.

Then check the column play once, before storage, using the same test as any other season: hold the deck, turn the bar, and watch whether the front wheel keeps up. Finding play in autumn means fixing it in autumn, when the scooter is in your hands rather than being discovered on the first spring ride.

## Spring is a check, not a service
Nothing needs to be done to the scooter over the winter. In spring, before the first ride: spin each wheel and listen, press the rear fender to confirm it still springs back clear of the wheel, and re-check the column play.

A wheel that grinds or a column that rocks is a bearing or a joint that spent the winter wet. Both are cheap now and are not cheap once a child is riding on them.

Storage is the one maintenance task where doing nothing visible is the correct outcome — a scooter that comes out of winter feeling exactly as it went in means the ten minutes in autumn worked.
`,
    zh: `一辆停放整个冬天的滑板车不会「磨损」。它会卡死、会压出平面、会长出间隙——而这三件事的发生都取决于你把它放在哪里，不是取决于冷。

好消息是，这些损伤几乎完全可以预防，而且功夫是前置的：秋天十分钟，然后春天之前什么都不用做。

## 一个冬天里真正会坏的是什么
三样东西，按「多常终结一辆滑板车的寿命」排序。

**轴承。** 水进了轮子轴承，然后留在那里。它不需要结冰才能造成损伤，它只需要待着。几周下来，带盖轴承里的水汽会把润滑脂挤走，轴承就在原地锈住。春天时这辆车并没有明显坏掉——它只是滚得很差，而家长会把这件事理解成「孩子长大了、车小了」。

**压出平面的聚氨酯轮。** 一个聚氨酯轮被单点受力压上几个月，就会定型。这在「立着存放」的车上最明显——整块踏板的重量都落在两个接触点上。

**折叠夹。** 一个在张力下闭合了几个月的夹子，就是弹簧或凸轮一直处在压缩状态的夹子。它是决定这辆车还能不能安全骑的零件，而它恰恰是纯粹因为「停放」而劣化的零件。

## 收起来之前先清洁，不是之后
本能是把车原样塞进去、春天再处理。这正好反了：秋天留在车上的东西，整个冬天都在对它起作用。

擦干净踏板和底面，然后专门把轮子和前叉区域擦干。留在踏板上的砂粒会把水汽压在表面上；留在车轴周围的泥直接压在密封圈上。

不要用水管冲。把水推向轴承密封圈，正是上面那个失效。一块湿布加一块干布，就是全部方法。

## 躺下存放，让轮子不吃力
价值最高的一个改变，是把重量从轮子上拿掉。

这里是滑板车和自行车真正不同的地方，而本站那篇自行车文章给出的是相反的结论，且理由充分。自行车靠轮子直立存放，因为它的轮胎是充气的、轮圈很大：立着放不会压住任何会定型的东西，而单轮悬挂反而会给另一个轮子加载。滑板车的轮子是几厘米大的实心聚氨酯，照搬那条指示，正好造出它在自行车上所要避免的那个平面。

折叠车侧躺完全可以，而且彻底消除了压出平面的风险。挂在车把上也行，前提是挂钩吃住车把而不是踏板。不行的是让它在轮子上立四个月——而这恰好就是滑板车被塞进车库角落的方式。

必须立着的话，每隔几周换一头受力，或者在下面垫块让轮子离地。

## 让夹子保持「开着」
这一条反直觉。折叠夹收起来时是闭合的，也就是被压缩的，而给这个夹子提供「咔」那一下的弹簧，正是会失效的东西。

把车展开——踏板和立杆到骑行角度、夹子松开——空间够的话就这样存。空间不够，至少让夹子扳手保持不扣合，让机构不承力。

## 高度夹和转向柱
存放前把车把降到最低档。一根伸长了放几个月的伸缩柱，会让高度夹长期受压，也会给关节施加最大的杠杆；降下来两个问题一起解决。

然后在存放前查一次转向柱间隙，方法和其他季节一样：压住踏板、转车把、看前轮跟不跟得上。秋天查出间隙就在秋天修——那时候车在你手上，而不是在春天第一次骑行时才被发现。

## 春天是「检查」，不是「保养」
整个冬天不需要对车做任何事。春天第一次骑之前：逐个转轮子听声音，压一下后挡泥板确认它还能弹回到离开轮子的位置，再查一次转向柱间隙。

轮子有研磨感、或者转向柱有晃动，就是某个轴承或关节湿着过了一个冬天。现在修很便宜，等孩子骑在上面之后就不便宜了。

存放是那种「什么都不显眼地发生」才算正确的保养任务——一辆从冬天出来、手感跟进去时一模一样的车，说明秋天那十分钟起了作用。
`,
  },

  // ---- scooter / scenario (1 -> 3, clears the threshold) -----------------
  {
    slug: "kids-scooter-wet-weather-riding",
    title: "Riding a Kids Scooter in Wet Weather",
    description:
      "Wet pavement changes what a scooter can do long before it looks dangerous. Which surfaces to avoid, and how to adjust the ride rather than cancel it.",
    keywords: ["scooter wet weather", "kids scooter rain", "scooter slippery pavement", "scooter after rain"],
    zhTitle: "雨天与湿滑路面的儿童滑板车",
    zhDescription:
      "湿路面在看起来危险之前，就已经改变了滑板车能做什么。哪些地面要避开，以及怎么调整骑法而不是取消出门。",
    zhKeywords: ["滑板车雨天", "儿童滑板车湿滑路面", "雨后骑行", "滑板车防滑"],
    topic: "scenario",
    topicOrder: 53,
    cover: HURTLE_RIDER,
    en: `A wet pavement does not make a scooter dangerous in the way ice makes a car dangerous. It removes margin. Everything still works, just with less room for the corrections a child makes constantly and does not know they are making.

The useful question is not "can we ride?" but "what changed, and which of the changes does this child's scooter handle badly?"

## What wet actually takes away
Three things, and only one of them is obvious.

**Grip at the wheel.** This is the obvious one. On a hard plastic or urethane wheel, a thin film of water on smooth stone or painted surface is enough to lose the front end, and it happens on the one surface a child rides on most: the smooth paving in front of a house or a shop.

**Braking.** A rear fender brake works by friction against the wheel. Water on the wheel reduces that friction, so the stopping distance is longer exactly when the child is least expecting it. A child who brakes the same way they always do will overshoot.

**Visibility, which is the one people miss.** A wet day is a dim day. A child on a scooter is low — below the height of a car's bonnet — and the scooter is the smallest thing on the path. This is a bigger change than the grip, and it is the one that has nothing to do with the scooter.

## Surfaces to rule out, in order
Painted lines, metal drain covers, and the smooth tiles outside shops. These are the surfaces that are slippery when dry-ish and genuinely bad when wet, and they are concentrated exactly where children ride.

Wooden decking and boardwalks next. Wet timber develops a film that is worse than wet stone.

Loose gravel and wet leaves last. These are less about sliding and more about the front wheel washing out sideways, which is a different and less recoverable failure.

Dry concrete and asphalt are fine. So is grass, at the slow speeds a child actually uses.

## What to change about the ride
The corrections matter more than the equipment.

Shorten the run. A child who rides the length of a path at speed has no margin to brake. Two shorter passes on a dry-ish stretch is the same amount of fun and a fraction of the exposure.

Brake earlier and softer. Tell the child to press the fender earlier than feels necessary and to press it lightly rather than stomp. Wet braking is progressive; a stomp locks nothing but does pitch the child forward.

Slow down before the surface changes, not on it. Turning or braking on a painted line is the specific combination that puts children down.

## What actually helps on the scooter
Wider, softer wheels grip better than narrow hard ones, which is one of the few places where a three-wheel scooter is genuinely better than a two-wheel one — the extra contact patch is doing real work on a damp surface.

A deck with grip tape is worth more than a smooth one, in the wet more than in the dry. If the deck is smooth plastic or bare metal, that is the part to be careful about: a foot that slips on the deck during a push is the most common wet-weather scooter fall there is, and it has nothing to do with the road.

Check the rear fender before a wet-season ride. A fender that has worn thin at the contact point still works in the dry and stops working in the wet, because the friction it needs is the friction it no longer has.

## What to check afterwards, every time
Water that goes in comes out badly. After a wet ride, dry the wheels and the fork area rather than leaving the scooter to drip dry, and spin each wheel once. A grinding wheel after a wet ride is water in a bearing, and it is worth dealing with the same day rather than at the end of the season.

The steering column is the other one. Water in the column joint shows up as the wobble described in [the steering column check](/guides/maintenance/kids-scooter-steering-column-wobble), and it is much easier to catch the same week than the same month.

## The honest summary
A scooter in the wet is not a different activity, it is the same activity with less margin. Rule out the four surface types, shorten the run, brake earlier, and dry the wheels afterwards.

The visibility point is the one worth carrying away: on a grey afternoon, a child on a scooter is below the beltline of every car on the road, and the scooter does not have a light. That is a bigger risk than the wet stone, and it is fixed by where you ride rather than by what you ride.
`,
    zh: `湿路面不会像冰对汽车那样让滑板车变得危险。它拿走的是**余量**。一切仍然能用，只是孩子那些不断在做、自己却不知道在做的修正，少了可用的空间。

真正有用的问题不是「还能不能骑」，而是「变了什么，其中哪些变化是这辆滑板车应付不好的」。

## 湿到底拿走了什么
三样，而且只有一样是显而易见的。

**轮子的抓地。** 这是显而易见的那一个。在硬塑料或聚氨酯轮上，光面石材或漆面上一层薄薄的水膜就足以让前轮失去抓地，而这偏偏发生在孩子最常骑的那种地面上：自家门前或店铺前那片光滑的铺装。

**刹车。** 后挡泥板刹车靠的是对轮子的摩擦。轮子上的水会减少那点摩擦，于是刹车距离在孩子最没预期的时候变长。一个照老习惯刹车的孩子会冲过头。

**视线——这是被漏掉的那一个。** 湿天是暗天。骑滑板车的孩子位置很低，低于汽车引擎盖的高度，而滑板车是路面上最小的东西。这个变化比抓地更大，而且是唯一跟滑板车本身无关的变化。

## 要排除的地面，按顺序
漆线、金属排水井盖、店铺门口的平滑瓷砖。这些地面在「差不多干」的时候就已经滑，湿的时候是真的糟，而且它们恰好都集中在孩子骑车的地方。

其次是木栈道和木平台。湿木头会形成一层比湿石头更糟的膜。

最后是松散碎石和湿落叶。这两种的问题不是打滑，而是前轮横向被「洗掉」，是一种不同、也更难救回来的失效。

干的水泥和沥青没问题。草地也没问题——在孩子实际使用的那个慢速度下。

## 骑法要改什么
修正比装备更管用。

缩短单程。一个一路骑到底的孩子没有刹车余量。在一段相对干的地方来回骑两趟，乐趣一样，暴露量只是零头。

更早、更轻地刹车。告诉孩子比「觉得需要」更早去压挡泥板，而且轻压而不是跺。湿地刹车是渐进的；跺下去并不会锁住什么，只会让孩子往前扑。

在路面变化之前减速，而不是在变化之上减速。在漆线上转弯或刹车，正是把孩子放倒的那个具体组合。

## 车上真正有用的东西
更宽、更软的轮子比窄硬轮抓地更好，这是三轮回滑板车确实优于两轮的地方之一——多出来的接地面积在潮湿表面上是真在干活。

有防滑砂纸的踏板比光滑踏板值钱，在湿天比在干天更明显。如果踏板是光滑塑料或裸露金属，那正是要小心的地方：蹬地时脚在踏板上滑掉，是湿天最常见的滑板车摔法，而且跟路面毫无关系。

湿季出门前查后挡泥板。接触点磨薄的挡泥板在干天还工作、在湿天就不工作了，因为它需要的摩擦力正是它已经没有的那个。

## 每次骑完之后查什么
进去的水，出来时都是坏样子。湿骑之后把轮子和前叉区域擦干，不要任它自己滴干，然后逐个转一下轮子。湿骑后滚起来有研磨感的轮子，是轴承进水了，值得当天处理而不是拖到季末。

另一个是转向柱。转向柱关节进水，表现为[转向柱检查](/guides/maintenance/kids-scooter-steering-column-wobble)里说的那种晃动，而当周发现比当个月发现容易得多。

## 诚实的总结
湿地上的滑板车不是另一项活动，而是同一项活动少了余量。排除那四类地面、缩短单程、更早刹车、事后擦干轮子。

值得带走的是关于视线那一点：在一个灰暗的下午，骑滑板车的孩子低于路上每一辆车的腰线，而滑板车没有灯。那比湿石头风险更大，而它靠「在哪里骑」解决，不是靠「骑什么」解决。
`,
  },
  {
    slug: "kids-scooter-school-run-surface",
    title: "The School Run on a Scooter",
    description:
      "The trip to school is a fixed route with fixed surfaces, kerbs and crowds. How to judge whether a scooter suits it before committing to it daily.",
    keywords: ["scooter to school", "school run scooter", "kids scooter commute", "scooter route safety"],
    zhTitle: "滑板车上学路",
    zhDescription:
      "上学是一条固定路线，路面、路缘、人流都是固定的。天天骑之前，先判断这条路适不适合滑板车。",
    zhKeywords: ["滑板车上學", "滑板车上学路", "儿童滑板车通勤", "滑板车路线"],
    topic: "scenario",
    topicOrder: 54,
    cover: JETSON_PROFILE,
    en: `A school run is not a ride. It is the same route, at the same time, with the same crowd, every day — and that changes what matters.

On a weekend ride the question is whether a scooter is fun. On a school run the question is whether it is reliable, and reliability on a fixed route is decided by four or five specific points on that route rather than by the scooter as a whole.

If your child already rides a bicycle to school, this article is not the one to read: [the bicycle version](/guides/scenario/kids-bike-riding-to-school) covers a vehicle whose wheels roll over what stops a scooter. The decision below is specifically about putting a child on small wheels on that same route.

## The thing that decides a scooter route: wheel size against obstacle size
A bicycle and a scooter are not judged by the same route test, and the difference is geometry rather than preference.

A bicycle's wheels are large enough to roll over a dropped kerb, a driveway lip, and a drain cover without the rider doing anything. A children's scooter's wheels are small enough that the same three obstacles are events: the front wheel arrives at a step that is a meaningful fraction of its own diameter, and the scooter stops while the child keeps going.

So the question is not how many obstacles the route has. It is how tall each obstacle is relative to the front wheel. A two-centimetre lip is nothing to a bicycle and is a trip to a scooter with five-centimetre wheels. The same route can be a sensible bicycle route and an unreasonable scooter route, which is why the school-run decision has to be made per vehicle rather than per child.

## The five obstacles that decide it
**Kerb drops onto the road.** The single most common source of school-run scooter incidents. Dropping off a kerb at speed unloads the front wheel and it lands at an angle. Wide-wheel scooters handle it; narrow hard wheels do not.

**Dropped kerbs and driveway lips.** Less dramatic and more frequent. A lip that is fine at walking pace is a trip at scooter pace, and the front wheel of a small scooter is small enough to catch it.

**Crossing points.** A child who has ridden the whole way arrives at a crossing at speed with a scooter under them. Teaching the dismount before the crossing, not at it, is the whole skill.

**Gates and school entrances.** The crowd at a school gate at 8:40 is the densest environment a child will ride in all week, and it is the one place where a scooter's stopping distance matters most.

**The last hundred metres.** Most schools have a policy about wheels on site. Finding out what it is before buying anything is worth more than any comparison of scooters.

## Storage is part of the route
If the scooter has to be carried, folded, or left somewhere at the school end, that is a daily cost. A folder is slower to deploy but goes under a desk; a rigid scooter is faster but has to be locked outside and is a theft target.

This is where a folding scooter earns its price on a school run — not for travel, but for the eight minutes a day it spends folded in a corridor. If your child's school has nowhere to put a rigid scooter, the folding question is already answered.

## Lighting, because the route is at the same time every day
A school run happens at a fixed hour, and for a good part of the year that hour is dim. This is the difference between a scooter for a school run and a scooter for the park: on a fixed schedule you cannot choose to ride later.

Anything reflective on the scooter or the child does more work than any other single item on this list, because it makes the child visible at the height where drivers are not looking. A scooter with LED-lit wheels or a lit deck is doing this job already.

## What to do about the pavement
On most school routes the pavement is the surface, and it is also where every other pedestrian on the route is walking.

A scooter at walking pace among pedestrians is fine. A scooter at speed among pedestrians is the thing that gets scooters banned from school routes, and it is a behaviour question rather than an equipment one. The practical rule is the one that keeps the trip pleasant for everyone: ride the open stretches, walk the crowded ones.

## Judging it honestly
A school run suits a scooter when the route has long smooth stretches, few kerb drops, somewhere to leave the scooter, and a child who will dismount without argument at crossings and gates.

It does not suit one when the route is a series of kerbs and crossings, or when the school end has nowhere to put it. Those are properties of the route, not of the scooter, and no choice of model fixes them.

The useful thing to do first is not buy anything: it is to walk the route once at 8:30 in the morning and count the dismounts. If the count is high, the honest answer is that this is a walking route — and a scooter that lives in the park is a better purchase than one that fights a school run every morning.
`,
    zh: `上学路不是一次「骑行」。它是同一条路线、同一个时间、同一群人，每天重复——而这改变了什么才重要。

周末骑车的问的是「好不好玩」。上学路问的是「可不可靠」，而一条固定路线上的可靠性，取决于那条路线上四五个具体的点，而不是整辆车。

如果你的孩子已经在骑车上学，这篇不是该读的那篇：[自行车版](/guides/scenario/kids-bike-riding-to-school)讲的是轮子能碾过滑板车会被卡住的东西的那种车。下面这个判断，专门针对「把同一个孩子放上小轮子、走同一条路」。

## 决定滑板车路线的关键：轮径对照障碍物尺寸
自行车和滑板车不能用同一套路线判据去评，差别在几何上而不是偏好上。

自行车的轮子大到可以越过下沉路缘、车道口小台阶和排水井盖，骑的人什么都不用做。儿童滑板车的轮子小到同样这三个障碍都算「事件」：前轮撞上一个占了自身直径不小比例的高度，车停住，孩子继续往前。

所以问题不是这条路有多少障碍，而是每个障碍相对前轮有多高。两厘米的台阶对自行车什么都不是，对轮子五厘米的滑板车就是一个跟头。同一条路可以是合理的自行车路线、同时是不合理的滑板车路线——这正是为什么上学路的决定要按「车」来做，不是按「孩子」来做。

## 决定成败的五个障碍
**下路缘到马路。** 上学路滑板车事故最常见的来源。带着速度从路缘下来，会让前轮卸载，然后以一个角度落地。宽轮滑板车能应付；窄硬轮不行。

**下沉式路缘和车道口的小台阶。** 不那么戏剧化，但更频繁。走路速度下无所谓的一个台阶，在滑板车速度下就是一个跟头，而小滑板车的前轮小到正好会卡进去。

**过街点。** 一路骑过来的孩子，是以速度到达路口的，脚下还踩着车。教「在路口之前下车，而不是在路口下车」，就是全部的技术点。

**校门和校园入口。** 早上八点四十的校门口，是孩子一周里会遇到的最高密度环境，也是滑板车刹车距离最要紧的那个地方。

**最后一百米。** 多数学校对校内用轮子有规定。先搞清楚这条规定是什么，比比较任何两款车都值钱。

## 存放也是路线的一部分
如果车在学校那一头要拎、要折、或者要找地方放，那是一项每天发生的成本。折叠车展开慢，但能塞进课桌下面；硬架车展开快，但只能锁在外面，而且是被偷的目标。

这正是折叠滑板车在上学路上值那个价钱的地方——不是为了旅行，而是为了它每天在走廊里折着待的那八分钟。如果孩子学校没有地方放硬架车，折叠这个问题已经被回答了。

## 灯光，因为这条路每天都在同一个时间
上学路发生在固定时段，而一年里有相当一部分时间，那个时段是昏暗的。这就是「上学路的滑板车」和「公园的滑板车」的区别：固定时间表意味着你不能选择晚点再骑。

车身上或孩子身上的任何反光件，都比这份清单上任何其他单项干的活更多，因为它让孩子出现在司机不看的高度上。带 LED 轮或发光踏板的滑板车，正是在做这件事。

## 人行道怎么办
多数上学路线上，人行道就是路面，同时也是这条路上所有其他行人走路的地方。

在人流中以步行速度骑滑板车没问题。在人流中以速度骑，就是「滑板车被禁止上上学路」的原因，而这是行为问题不是装备问题。实用的规则是那条让所有人都舒服的规则：开阔段骑，拥挤段走。

## 诚实地判断
当这条路有长而平滑的段落、很少下路缘、有地方放车、并且孩子会在路口和大门处不争辩地下车，它适合滑板车。

当这条路是一连串路缘和路口，或者学校那头根本没地方放，它就不适合。这些是**路线**的属性、不是车的属性，选哪个型号都修不好。

第一件该做的事不是买东西，而是早上八点半走一遍这条路，数一下下车点。如果数字很高，诚实的答案是这是一条步行路线——一辆放在公园里的滑板车，比一辆每天早上都在跟上学路较劲的滑板车，是更好的购买。
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