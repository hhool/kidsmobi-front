/**
 * R48 — fill the guides category×topic gaps, batch 1: stroller.
 *
 * WHY THIS EXISTS. The category axis shipped 2026-11-24 as 5 category pages +
 * 35 composite pages. A composite clears COMPOSITE_INDEX_THRESHOLD (3 articles)
 * and becomes indexable; below that it exists but carries noindex,follow, so a
 * URL the site advertises internally never earns an index entry. The stroller
 * library is the deepest (21 of 68 published guides) and still had four
 * combinations under the bar:
 *
 *   /guides/stroller/budget/        1  -> needs 2
 *   /guides/stroller/risk/          1  -> needs 2
 *   /guides/stroller/special/       2  -> needs 1
 *   /guides/stroller/maintenance/   1  -> needs 2
 *
 * This script adds those 7 articles, taking every stroller combination to >= 3.
 *
 * GROUNDING RULE (same as extend-stroller-guides-c3.mjs, and the reason the
 * copy below reads the way it does). The site is an editorial publisher with no
 * laboratory. So this copy:
 *   - states no third-party figure: no model weights, no prices, no load
 *     limits, no recall conclusions, no certification claims.
 *   - makes no first-person measurement claim (no "we tested", 实测, 实验室).
 *     check-honesty-claims.ts scans the built HTML for exactly these.
 *   - argues from published-document structure instead: which question a spec
 *     sheet answers, which line on a listing is the one that matters, what a
 *     standard number does and does not promise. That is checkable by the
 *     reader at the source, which is the point.
 *
 * The one product fact the copy does use is deliberately generic and true of
 * this catalogue by inspection: strollers are listed with a stated maximum
 * child weight and a stated recline, and those two numbers decide whether a
 * given child can ride. Nothing is attributed to a named model.
 *
 * CONTRACT
 *   - Creates 7 NEW records. Never edits an existing one.
 *   - Refuses to run if a slug already exists (no silent overwrite).
 *   - Idempotent: a second --apply skips every slug it already wrote.
 *   - Writes a backup of everything it sends to .workbuddy/tmp/guides-fill-b1/.
 *   - Every record is published, en + zh bodies, cover from the existing image
 *     pool (check-guide-covers.mjs tolerates two guides sharing a cover, never
 *     more, so covers are assigned from images used at most once so far).
 *
 * Usage:
 *   node scripts/fill-guides-stroller-gaps.mjs              # dry run
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/fill-guides-stroller-gaps.mjs --apply
 *   node scripts/fill-guides-stroller-gaps.mjs --verify     # re-fetch and assert
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { adminHeaders } from "./_cmsAdminToken.mjs";

const APPLY = process.argv.includes("--apply");
const VERIFY = process.argv.includes("--verify");
const API_BASE = (process.env.CMS_API_BASE || "https://store.balancebiketoddler.com").replace(/\/+$/, "");
const TOKEN = String(process.env.CMS_ADMIN_ALL_TOKEN || "").trim();

/** Claims this site cannot make about itself. Scanned before any write. */
const FORBIDDEN_EN = [
  "we tested", "hands-on testing", "in our test group", "in our testing",
  "in our checks", "backed by real testing", "lab test", "lab-measured",
  "independent safety testing", "we measured", "our laboratory",
];
const FORBIDDEN_ZH = [
  "实测", "实验室", "测试方法", "台架测试", "我们测试", "我们验证", "本组实测",
];

/**
 * The seven articles.
 *
 * `links` are asserted against the published slug list at run time, so a
 * renamed target fails the script instead of shipping a 404 into body copy.
 */
const ARTICLES = [
  // ---- stroller / budget (1 -> 3) -------------------------------------
  {
    slug: "stroller-price-tiers-what-you-pay-for",
    // Titles are capped to 39 chars of stem: 60 total minus the 21-char
    // " | BalanceBikeToddler" suffix (SITE_TITLE_SUFFIX). A longer stem gets
    // cut mid-clause by buildDocumentTitle() — the first draft of this batch
    // shipped "Stroller Price Tiers: What Each Step Up | BalanceBikeToddler".
    // The full detail lives in the description, not in the tab title.
    title: "Stroller Price Tiers: What You Pay For",
    description:
      "Splitting the stroller market into price tiers, and naming the one feature that changes at each step — so a higher price has to justify itself.",
    keywords: ["stroller price tiers", "stroller budget guide", "what does a stroller price include", "cheap vs expensive stroller"],
    zhTitle: "推车价格分档：每一档多买到了什么",
    zhDescription:
      "把推车市场按价位分档，并点出每一档真正改变的那一项配置——让更高的价格必须自己说明理由。",
    zhKeywords: ["推车价格分档", "婴儿推车预算", "推车价格构成", "便宜与昂贵推车区别"],
    topic: "budget",
    topicOrder: 12,
    cover: "https://store.balancebiketoddler.com/stroller/Chicco/Rank_8_ASIN_B08VPVLF95_Chicco%20Bravo%203-in-1%20Trio%20Travel%20System%20Bravo%20Quick/images/primary.jpg",
    en: `A stroller price is not one number for one thing. It is a bundle of decisions, and the useful question is which decision each tier actually changes. Read the tiers below as a map of where money goes, not as a ranking of quality.

## The floor: it has to work, and that is the whole claim
The least expensive usable stroller does a short list of things. It folds, it rolls, it has a restraint, and it holds a child up to a stated weight. Nothing about that list is negotiable, and nothing above it is required for a safe ride. If a listing at this end cannot state a maximum child weight or shows no restraint detail, the missing line is the finding — see [how to choose a baby stroller](/guides/beginner/how-to-choose-the-perfect-baby-stroller) for the shortlist of lines to look for.

The trade at this tier is weight and rolling resistance. A cheaper frame is usually a heavier one, and a heavier stroller is the one that gets left at home. That is a real cost, but it is a cost in habit, not in safety.

## The middle: you are buying the fold and the seat
The middle tier mostly buys two things. The first is a fold that behaves the same way every time, which matters because a fold you have to think about is a fold you avoid. The second is a seat that reclines to a stated angle rather than "multi-position", because a stated angle is a number you can check against a child's age.

This is also where [travel strollers under $200](/guides/budget/stroller-under-200) sit, and why the sub-$200 question is mostly a question about the fold.

## The top: you are buying geometry, not luxury
At the top the frame gets lighter at the same strength, the wheels get larger, and the seat gains positions at both ends. Larger wheels are the change most people feel: they roll over pavement joints that stop a small wheel. Whether that is worth a higher price depends on where you walk, not on how much you can spend.

## A rule for reading any price
Ask what changed from the tier below. If the answer is a material name or a brand badge, the price is a preference. If the answer is a stated recline angle, a stated folded dimension, or a wheel size, the price is a specification you can weigh against your own week.

## Next
- [Travel strollers under $200](/guides/budget/stroller-under-200)
- [Best travel stroller](/guides/best/best-travel-stroller-2026)
- [Lightweight travel stroller](/guides/scenario/lightweight-travel-stroller)`,
    zh: `推车的价格不是一个数字对应一件东西。它是一组取舍的打包价，真正有用的问题是：每一档价格究竟改变了哪一个取舍。下面按「钱花在哪里」来读，而不是按质量排高低。

## 底线档：它只需要能用
最便宜的那一档只做几件事：能折叠、能滚、有约束装置、能承托到标明的最大体重。这几项都不可让，而在这之上没有任何一项是安全骑乘所必需的。如果这一档的页面写不出最大体重，或者完全没有约束装置的说明，缺的那一行本身就是结论——该核对哪些行，见[如何挑选婴儿推车](/guides/beginner/how-to-choose-the-perfect-baby-stroller)。

这一档让掉的是重量与滚动阻力。便宜的车架通常更重，而更重的推车就是会被留在家的那台。这是真实的代价，但是使用习惯上的代价，不是安全上的代价。

## 中间档：买的是折叠与座兜
中间档主要买两样东西。第一是每次表现一致的折叠——需要想一下才折得好的折叠，就是一个你会避开的折叠。第二是能标出具体角度的座兜，而不是只写「多档可调」；标出角度才是能拿去对照孩子月龄的数字。

[两千元以内的旅行推车](/guides/budget/stroller-under-200)也落在这一档，这也是为什么这个价位的问题基本上就是折叠的问题。

## 顶配档：买的是几何，不是奢华
到了顶配，同样的强度下车架更轻，轮子更大，座兜两端都多出档位。大轮是最能被感知的变化：它能滚过小轮会卡住的铺装接缝。值不值这个价，取决于你在哪里走路，而不取决于你能花多少。

## 读价的通用规则
问一句：比下一档多出来的到底是什么。如果答案是材质名或品牌标，那这个价是偏好；如果答案是标注的靠背角度、标注的折叠尺寸或轮径，那这个价是可以拿去和自己那一周对照的规格。

## 延伸阅读
- [两千元以内的旅行推车](/guides/budget/stroller-under-200)
- [最佳旅行推车](/guides/best/best-travel-stroller-2026)
- [轻量旅行推车](/guides/scenario/lightweight-travel-stroller)`,
  },
  {
    slug: "stroller-what-cheap-models-skip",
    title: "What Cheap Strollers Skip, and Why",
    description:
      "Not every omission at a low price is a defect. Separating the cuts that cost safety from the cuts that only cost convenience.",
    keywords: ["what cheap strollers skip", "budget stroller tradeoffs", "stroller cost cutting", "inexpensive stroller safety"],
    zhTitle: "低价推车省掉了什么，以及哪些省法无害",
    zhDescription:
      "低价位上的每一处省略并不都是缺陷。把影响安全的省略，与只影响便利的省略分开来看。",
    zhKeywords: ["低价推车省略", "推车成本取舍", "便宜推车安全", "推车减配"],
    topic: "budget",
    topicOrder: 13,
    cover: "https://store.balancebiketoddler.com/stroller/Jeep/Rank_Similar_ASIN_B0C9RLK9KP_Jeep%20Deluxe%20Wagon%20Stroller%20with%20Canopy/images/primary.jpg",
    en: `Every inexpensive stroller is inexpensive because something was removed. The review question is not whether a cut happened but which one, because two strollers at the same price can be cutting in completely different places.

## Cuts that only cost you convenience
These are the ordinary ones at a low price, and none of them make the stroller unsafe.

- **Fewer recline positions.** Two instead of five. A child either can lie back enough for the age or cannot; the extra stops are comfort for a narrow band of ages.
- **Smaller wheels.** Rolling resistance goes up on rough pavement. You feel it; the child does not.
- **A smaller basket.** A capacity question, not a safety one.
- **A shorter canopy.** Shade coverage, which is a sun-exposure question you can also solve by other means.
- **A heavier frame.** The one that matters most in daily use, because a heavy stroller gets left behind.

## Cuts that change what the stroller is
These are the ones worth walking away from.

- **No stated maximum child weight.** If the maker will not publish a number, there is no way to know whether a child is inside the design envelope. See [weight and fit checks](/guides/risk/stroller-safety-tips).
- **A restraint with no shoulder straps.** A lap belt alone does not keep a small child upright in a reclined seat.
- **A brake that does not hold on a slope.** A brake is a parking device. If the listing does not describe it at all, treat that as unanswered.
- **A fold with no lock.** A stroller that unfolds itself while being carried is a hazard to the person carrying it.
- **A seat that reclines with no stated angle.** "Multi-position" is not a number.

## How to tell the two apart on a listing
Look for a specification table rather than marketing paragraphs. A maker that publishes weight, folded dimensions, maximum child weight and recline turns its omissions into visible gaps. A listing with only adjectives has hidden them. That difference — whether the gaps are visible — is more predictive than the price itself.

## Where the cheap tier is genuinely fine
For a second stroller kept in a car, for short trips, for a child near the top of the weight range who will shortly outgrow the whole category, the convenience cuts cost little. [Strollers under $200](/guides/budget/stroller-under-200) are usually enough for exactly that role.

## Next
- [Stroller price tiers](/guides/budget/stroller-price-tiers-what-you-pay-for)
- [Stroller safety tips](/guides/risk/stroller-safety-tips)
- [How to choose a baby stroller](/guides/beginner/how-to-choose-the-perfect-baby-stroller)`,
    zh: `每一台便宜的推车之所以便宜，都是因为省掉了什么。要判断的不是「有没有省」，而是「省在哪」——同价位两台车，可能省的完全不是同一处。

## 只让你不方便的省法
这些在低价档很常见，且都不会让推车变得不安全。

- **靠背档位更少。** 两档而不是五档。孩子要么能放到适合其月龄的角度、要么不能；多出来的档位只是给一小段月龄提供舒适。
- **轮子更小。** 粗铺装上滚动阻力更大。你会有感觉，孩子没有。
- **篮筐更小。** 这是容量问题，不是安全问题。
- **车篷更短。** 这是遮阳面积问题，也可以用别的办法解决。
- **车架更重。** 日常使用里影响最大的一项，因为重的车会被留在家。

## 会改变「这台车是什么」的省法
这些是值得转身走开的。

- **不标最大体重。** 厂商不给数字，就无从判断孩子是否还在设计范围内。见[重量与合身核对](/guides/risk/stroller-safety-tips)。
- **约束装置没有肩带。** 只有腰带的约束，在后倾座兜里撑不住小月龄孩子。
- **在斜坡上停不住的刹车。** 刹车是驻车装置。页面完全不描述它，就当作没有回答。
- **折叠没有锁定。** 抱着走时自己打开的推车，威胁的是抱车的那个人。
- **座兜可后倾但没有标注角度。** 「多档可调」不是一个数字。

## 在页面上怎么区分这两类
看有没有规格表，而不是看形容词段落。肯公布重量、折叠尺寸、最大体重与靠背角度的厂商，会把自己的省略变成看得见的空白；只有形容词的页面，把空白藏起来了。「缺的东西看不看得见」这件事，比价格本身更能预示结果。

## 便宜档真正够用的场景
作为放在车里的第二台、用于短途、或者给一个已接近体重上限、很快就将超出整个类别的孩子——这时的便利性省略代价很小。[两千元以内的旅行推车](/guides/budget/stroller-under-200)通常正好够这个角色。

## 延伸阅读
- [推车价格分档](/guides/budget/stroller-price-tiers-what-you-pay-for)
- [推车安全要点](/guides/risk/stroller-safety-tips)
- [如何挑选婴儿推车](/guides/beginner/how-to-choose-the-perfect-baby-stroller)`,
  },

  // ---- stroller / risk (1 -> 3) ---------------------------------------
  {
    slug: "stroller-brake-and-restraint-checks",
    title: "Stroller Brake and Harness Checks",
    description:
      "A short pre-walk routine for the two systems that fail silently: the parking brake and the harness. What to look at, and what a pass looks like.",
    keywords: ["stroller brake check", "stroller harness check", "stroller safety inspection", "stroller brake not holding"],
    zhTitle: "推车刹车与安全带核对",
    zhDescription:
      "出门前对两套会无声失效的系统做一次短核对：驻车刹车与五点式安全带。看什么，以及什么样算通过。",
    zhKeywords: ["推车刹车检查", "推车安全带检查", "推车安全检查", "推车刹车停不住"],
    topic: "risk",
    topicOrder: 12,
    cover: "https://store.balancebiketoddler.com/stroller/Delta/Rank_Similar_ASIN_B0B5LTFQ2R_Delta%20Children%20LX%20Side%20by%20Side%20Stroller/images/primary.jpg",
    en: `Two systems on a stroller can fail while everything still looks normal: the parking brake and the harness. Both are worth thirty seconds before a walk, because both failures are quiet.

## The brake is a parking device, not a slowing device
A stroller brake holds a stationary stroller on a slope. It is not designed to slow a moving one, and using it that way is how brake assemblies wear out early. Test it the way it will be used: park on the steepest surface you actually meet, engage it, and push. If the wheels rotate under a firm push, the brake is not passing — regardless of what the pedal feels like.

Two things make a brake pass consistently:
- **Engagement on both wheels**, or on a single axle that locks both. A brake that grabs one wheel lets the stroller pivot rather than stop.
- **A pedal you can set with a foot in shoes.** A brake that needs a hand, or needs aiming, is one that will be skipped when your hands are full.

Check the brake after any change of surface, and again after the stroller has been in a car boot. A folded stroller can land on the brake lever in transit.

## The harness: five points, and a fit test
A restraint should hold a child at five points: two shoulders, two hips, and one between the legs. A lap belt alone lets a reclined child slide up and sideways.

The fit is separate from the count. Once buckled, the strap between the shoulder and the buckle should not be loose enough to slip off a shoulder. Test it the way a wriggling child would: ask the child to lean forward as far as they can. If a strap leaves the shoulder, tighten it — see [stroller safety tips](/guides/risk/stroller-safety-tips) for the full pre-walk list.

## Two checks that are easy to skip
- **The fold lock.** Before carrying the stroller, confirm it is locked open. A stroller that unfolds under load drops whatever is in the basket onto whoever is behind it.
- **The basket limit.** Most baskets carry a stated maximum, and overloading one changes the stroller's balance far more than the weight suggests, because the load sits outside the wheelbase.

## What this routine is not
It is not a substitute for the maker's inspection schedule, and it will not catch a fatigue crack inside a frame. It catches the two failures that a parent can actually see and fix, which is the reason to do it often rather than thoroughly.

## Next
- [Stroller safety tips](/guides/risk/stroller-safety-tips)
- [How to clean a travel stroller](/guides/maintenance/stroller-how-to-clean)
- [How to choose a baby stroller](/guides/beginner/how-to-choose-the-perfect-baby-stroller)`,
    zh: `推车上有两套系统会在一切看起来正常时失效：驻车刹车与约束装置。出门前各花三十秒值得，因为这两种失效都不出声。

## 刹车是驻车装置，不是减速装置
推车刹车的作用是把静止的车固定在坡上，不是用来给移动中的车减速——那样用，刹车组件会提前磨损。按它实际会被用的方式测：停在你会遇到的真实坡度上，踩下刹车，推。如果用力推时轮子还在转，就是没通过，无论踏板手感多好。

让刹车稳定通过的两件事：
- **两轮同时咬合**，或通过同一根轴锁住两轮。只咬住一个轮子的刹车，会让推车原地转向而不是停下。
- **穿着鞋能用脚踩下的踏板。** 需要用手、或者需要对位的刹车，在双手被占满时一定被跳过。

换了路面之后要再查一次；推车从后备箱拿出来之后也要再查一次——折叠状态下，车可能压到了刹车杆。

## 约束装置：五点，加一次贴合测试
约束装置应做到五点固定：两肩、两髋、以及两腿之间一点。只有腰带的约束，会让后倾的孩子往上、往侧滑出去。

贴合与点数要分开看。扣好之后，肩带到卡扣之间不该松到能从肩上滑脱。按孩子会扭的方式测：让孩子尽量往前趴。如果有带子离开肩膀，就收紧——完整的出门前清单见[推车安全要点](/guides/risk/stroller-safety-tips)。

## 两个最容易被跳过的检查
- **折叠锁定。** 抱车前确认是锁开状态。承重时自己打开的推车，会把篮筐里的东西倒在后面的人身上。
- **篮筐上限。** 多数篮筐标有最大承重，超载对平衡的影响远大于那个数字本身，因为载荷落在轴距之外。

## 这套流程不是什么
它不能替代厂商的检查周期，也查不出车架内部的疲劳裂纹。它抓的是家长看得见、修得动的两种失效——这也是要「常做」而不是「做得彻底」的理由。

## 延伸阅读
- [推车安全要点](/guides/risk/stroller-safety-tips)
- [如何清洁旅行推车](/guides/maintenance/stroller-how-to-clean)
- [如何挑选婴儿推车](/guides/beginner/how-to-choose-the-perfect-baby-stroller)`,
  },
  {
    slug: "stroller-tip-over-and-loading",
    title: "Stroller Tip-Over: Position Beats Load",
    description:
      "Strollers tip because of where the weight sits and what is hanging off the handle, not because of how much is inside. How to load one so it stays planted.",
    keywords: ["stroller tip over", "stroller stability", "stroller basket weight", "stroller handle bag safety"],
    zhTitle: "推车倾翻：位置比重量更关键",
    zhDescription:
      "推车会翻，是因为重量的位置和挂在扶手上的东西，而不是因为装了多少。怎样装载才能让它稳稳站住。",
    zhKeywords: ["推车倾翻", "推车稳定性", "推车篮筐承重", "推车扶手挂包"],
    topic: "risk",
    topicOrder: 13,
    cover: "https://store.balancebiketoddler.com/stroller/Radio/Rank_Similar_ASIN_B0CP3GY8WK_Radio%20Flyer%20City%20Luxe%20Stroll%20N%20Wagon/images/primary.jpg",
    en: `A stroller stays upright because its centre of gravity sits inside the polygon its wheels make. Loading changes where that centre sits. The thing that moves it furthest is not the total weight but the position of the weight, and the most consequential position is behind the rear axle.

## Why the handle is the worst place for a bag
A bag hung on the handle sits behind and above the rear wheels. Its leverage on the rear axle is large, and it grows the moment the child leans forward or the stroller is on a slope. Makers publish a handle-load limit for this reason; many publish none, which is its own answer about how much that hook should carry.

If a stroller has no stated handle limit, carry the bag yourself or put it below the seat. A hook is for a light item you could also hold.

## Why the basket limit is about balance, not capacity
A basket under the seat sits inside the wheelbase, which is why it tolerates more weight than the handle does. It is still a stated maximum, and the reason is geometry rather than strength: a basket loaded past its limit moves the centre of gravity backward and downward, and the stroller's steering and its resistance to a sideways nudge both change.

The practical rule: heavy at the bottom, near the middle, and nothing above the seat back.

## The three moments a stroller tips
1. **Lifting the front wheels to mount a kerb** with a loaded basket. The load swings back as the front lifts.
2. **A child climbing in or out unaided.** The child's weight moves outside the wheelbase before it is seated.
3. **Parking on a slope with the brake off**, or with the brake on one wheel only — see [brake and restraint checks](/guides/risk/stroller-brake-and-restraint-checks).

Each of these is manageable with a habit: unload before mounting a kerb, hold the stroller while a child climbs, and park nose-downhill with the brake set.

## What does not help
Leaning the stroller against a wall or a car. It will still be the same unstable object when it moves, and a stroller that has already started to fall is harder to catch than one that was never leaning. The only stable state is on its wheels, on its brake, on ground that is not a slope.

## Next
- [Brake and restraint checks](/guides/risk/stroller-brake-and-restraint-checks)
- [Stroller safety tips](/guides/risk/stroller-safety-tips)
- [Umbrella vs full-size stroller](/guides/special/stroller-umbrella-vs-full)`,
    zh: `推车能立住，是因为它的重心落在四个轮子围成的多边形之内。装载会改变重心的位置。把它挪得最远的不是总重量，而是重量所在的位置——其中后果最大的位置，是后轴之后。

## 为什么扶手是最不该挂包的地方
挂在扶手上的包位于后轮之后、之上，对后轴的力臂很大；孩子往前一趴、或者地面一斜，这个力臂立刻变大。厂商正是出于这个原因会标注扶手承重上限；很多厂商干脆不标，而这本身就是那个挂钩该挂多少的答案。

如果车上没有标注扶手承重，就把包自己背着，或放到座兜下方。挂钩是给「你本来也拿得动」的轻东西用的。

## 为什么篮筐上限是平衡问题而不是容量问题
座下的篮筐落在轴距之内，所以它能承受的重量比扶手多。但它仍然是一个标注上限，理由在几何而非强度：超载会把重心往后、往下挪，推车的转向手感和抗侧向推挤的能力都会变。

实用规则：重的放底部、靠中间，座背以上什么都不放。

## 推车会翻的三个时刻
1. **抬前轮上台阶**，而篮筐是装满的。前轮抬起时载荷向后摆。
2. **孩子自己爬上或爬下。** 孩子坐稳之前，体重已经跑到轴距之外。
3. **停在坡上却没拉刹车**，或只刹住了一个轮子——见[刹车与约束核对](/guides/risk/stroller-brake-and-restraint-checks)。

这三点都能靠习惯处理：上台阶前先卸货，孩子上下车时扶住车，停车时车头朝坡下并踩住刹车。

## 什么办法没用
把推车靠在墙上或车身上。它一动起来仍然是那台不稳的车，而且已经倒了一半的车比从没靠过的车更难接住。唯一稳定的状态是：靠自己的轮子、踩住刹车、地面不是斜坡。

## 延伸阅读
- [刹车与约束核对](/guides/risk/stroller-brake-and-restraint-checks)
- [推车安全要点](/guides/risk/stroller-safety-tips)
- [伞车与全尺寸推车](/guides/special/stroller-umbrella-vs-full)`,
  },

  // ---- stroller / special (2 -> 3) ------------------------------------
  {
    slug: "stroller-for-tall-parents-and-children",
    title: "Strollers for Tall Parents and Kids",
    description:
      "Handle height, stride clearance and seat-back height are three different numbers. Which one a tall parent or a fast-growing child actually runs out of first.",
    keywords: ["stroller for tall parents", "adjustable handle stroller", "tall toddler stroller", "stroller seat back height"],
    zhTitle: "高个子家长与高个子孩子的推车",
    zhDescription:
      "扶手高度、步幅空间、座背高度是三个不同的数字。高个子家长或长得快的孩子，最先用完的到底是哪一个。",
    zhKeywords: ["高个子家长推车", "可调扶手推车", "高个子幼儿推车", "推车座背高度"],
    topic: "special",
    topicOrder: 12,
    cover: "https://store.balancebiketoddler.com/stroller/Chicco/Rank_2_ASIN_B0D2XQ1N7Y_Chicco%20Mini%20Stroller%20Corso/images/primary.jpg",
    en: `"For tall parents" and "for tall children" are not the same requirement, and a stroller can satisfy one while failing the other. Three separate measurements decide it.

## 1. Handle height — a parent problem
The handle should let you push with a straight wrist and a relaxed shoulder. Too low and you lean forward for the whole walk; too high and your arms stay raised. An adjustable handle covers a household with two very different pushers, which is why it appears on the [umbrella vs full-size](/guides/special/stroller-umbrella-vs-full) comparison as a reason to accept a heavier frame.

Where a listing gives one handle height and it is near the top of the range most strollers publish, treat it as designed for a shorter pusher. A stated height is checkable; "ergonomic" is not.

## 2. Stride clearance — the one people forget
Taller pushers need the rear axle far enough forward that a normal stride does not kick it. This is a chassis-length question, and it is why a short-wheelbase stroller that folds beautifully can be miserable to walk behind. If you are tall, put your foot where your stride would land before you buy.

A related symptom: a stroller you keep kicking is one you will push with one hand and at arm's length, which then loads the handle in exactly the way [tip-over advice](/guides/risk/stroller-tip-over-and-loading) warns about.

## 3. Seat-back height and canopy clearance — a child problem
A tall child outgrows a stroller from the top down. The first limit reached is usually headroom under the canopy, then seat-back height, then the stated maximum weight. A child whose head touches the canopy is already too tall for the seat regardless of weight.

For a fast-growing child, seat-back height matters more than the weight limit, because the weight limit is generous on most strollers while headroom is not.

## What to check when one number is missing
Ask which of the three the listing does not state, and judge the omission on that axis rather than the whole stroller. A stroller that publishes handle height and seat-back height but no folded length is a different risk for a tall parent than one that publishes none of the three.

## Next
- [Umbrella vs full-size stroller](/guides/special/stroller-umbrella-vs-full)
- [Travel system vs separate](/guides/special/stroller-travel-system)
- [How to choose a baby stroller](/guides/beginner/how-to-choose-the-perfect-baby-stroller)`,
    zh: `「适合高个子家长」和「适合高个子孩子」不是同一个需求，一台推车可能满足其中一个却败在另一个。靠三个彼此独立的尺寸来判断。

## 一、扶手高度——家长的问题
扶手应当让你直着手腕、松着肩膀推。太低，整趟路你都在前倾；太高，你的手臂一直抬着。可调扶手能覆盖家里两个身高差很多的推车人——这也是[伞车与全尺寸推车](/guides/special/stroller-umbrella-vs-full)里，愿意为此接受更重车架的理由。

如果页面只给一个扶手高度，而这个数接近同类推车的上限，就当作它是按矮个子推车人设计的。标出来的高度可以核对，「人体工学」不能。

## 二、步幅空间——最容易被忘的一项
个子高的推车人需要后轴足够靠前，正常一步不会踢到它。这是底盘长度的问题，也是为什么一台折叠起来很漂亮、轴距却很短的推车，推起来可能很难受。如果你个子高，买之前先把脚放在你一步会落下的位置。

一个相关症状：你一直踢到的推车，最后会被你单手、伸长手臂去推，而这恰好把扶手加载成[防倾翻建议](/guides/risk/stroller-tip-over-and-loading)所警告的那种状态。

## 三、座背高度与车篷净空——孩子的问题
高个子孩子是从上往下「长超」推车的。最先触到的通常先是车篷下的头顶空间，然后是座背高度，最后才是标注的最大体重。头已经碰到车篷的孩子，无论体重多少，都已经太高了。

对长得快的孩子，座背高度比体重上限更要紧：多数推车的体重上限给得宽松，头顶空间却不宽松。

## 缺一个数字时怎么判断
问清楚页面没标出这三项中的哪一项，然后只按那一个轴来判断，而不是判断整台车。一台标了扶手高度与座背高度、但没标折叠长度的推车，对高个子家长来说，与三项都不标的推车是不同性质的风险。

## 延伸阅读
- [伞车与全尺寸推车](/guides/special/stroller-umbrella-vs-full)
- [旅行系统与分开购买](/guides/special/stroller-travel-system)
- [如何挑选婴儿推车](/guides/beginner/how-to-choose-the-perfect-baby-stroller)`,
  },

  // ---- stroller / maintenance (1 -> 3) --------------------------------
  {
    slug: "stroller-wheel-and-brake-care",
    title: "Stroller Wheel and Brake Care",
    description:
      "Most stroller faults start at the wheels and the brake. A care routine built around what actually wears: bearings, tyre condition and brake engagement.",
    keywords: ["stroller wheel care", "stroller brake maintenance", "stroller wheel bearing", "stroller maintenance schedule"],
    zhTitle: "推车轮子与刹车养护",
    zhDescription:
      "多数推车故障都从轮子和刹车开始。围绕真正会磨损的三处来安排养护：轴承、胎况与刹车咬合。",
    zhKeywords: ["推车轮子养护", "推车刹车保养", "推车轴承", "推车保养周期"],
    topic: "maintenance",
    topicOrder: 12,
    cover: "https://store.balancebiketoddler.com/stroller/Baby/Rank_Similar_ASIN_B0D97K3T2S_Baby%20Trend%20Journey%20Jogging%20Stroller/images/primary.jpg",
    en: `A stroller has few moving parts, and almost all of them are at the wheels or the brake. That is why maintenance can be short and still effective: the same four checks cover most of what goes wrong.

## Bearings: listen before you look
Spin each wheel off the ground. A healthy bearing turns freely and stops gradually. A worn one makes a dry, gritty sound, stops abruptly, or wobbles when you try to move the wheel side to side. Wobble is the urgent one — a bearing that has lost its preload is on its way to seizing, and a seized wheel on a moving stroller drags the frame.

Bearings are usually the first part to be replaced rather than repaired. If a wheel has a stated replaceable bearing, a set is cheap; if the wheel is a sealed unit, the wheel is the part.

## Tyres: solid, foam or air
The tyre construction decides the care routine.
- **Solid or foam tyres** do not puncture and do not need pressure checks. They do flat-spot if the stroller sits loaded in one place for months, which is a storage habit rather than a fault.
- **Air tyres** need pressure checked before a long walk and after a season in storage. Under-inflated tyres are the common cause of a stroller that suddenly feels heavy.

Whatever the tyre, inspect the tread for embedded grit after gravel or beach use, and remove it before it works its way into the casing.

## The brake: the check that also counts as care
Engaging and releasing the brake is the routine — on flat ground, then on a slope. A brake that has begun to engage late, or that needs a harder push, is telling you the mechanism is worn or has picked up grit. Clean around the engagement point, then re-test.

Do not oil a brake mechanism to make it engage more smoothly unless the maker's instructions say to. Oil attracts grit, and grit is what wore it in the first place.

## The frame and the joints
Wipe the frame rather than washing it, and pay attention to the fold joint and any telescoping section. Grit in a joint is what makes a fold stiff, and a stiff fold is the one that stops being used. For the fabric and seat, see [how to clean a travel stroller](/guides/maintenance/stroller-how-to-clean).

## A routine short enough to keep
Weekly: spin the wheels, engage the brake on a slope. Monthly: check the fold joint, look at tyre tread. Seasonally: pressure if air tyres, and a full wipe-down before storage. Anything shorter than that stops being done.

## Next
- [How to clean a travel stroller](/guides/maintenance/stroller-how-to-clean)
- [Brake and restraint checks](/guides/risk/stroller-brake-and-restraint-checks)
- [Lightweight travel stroller](/guides/scenario/lightweight-travel-stroller)`,
    zh: `推车的活动部件不多，而且几乎都在轮子和刹车上。所以养护可以很短、又确实有效：同样的四项检查，覆盖了大部分会出的问题。

## 轴承：先听，再看
把每个轮子抬离地面转一下。健康的轴承转动顺畅、缓慢停下。磨损的会发出干涩的沙沙声、突然停住，或者在你左右晃轮子时松动。松动是最要紧的——失去预紧的轴承正在走向卡死，而一台行进中的推车上出现卡死的轮子，会拖拽车架。

轴承通常是最先「换而不是修」的零件。如果轮子标明轴承可更换，一组很便宜；如果轮子是整体密封件，那么要换的就是轮子本身。

## 轮胎：实心、发泡还是充气
轮胎结构决定养护方式。
- **实心或发泡胎**不会扎、不需要查气压。但若长期单点受压停放，会压出平点——那属于存放习惯问题，不是故障。
- **充气胎**需要在长途出行前、以及存放一季后检查气压。气压不足，是推车「突然变重」的常见原因。

无论哪种胎，走过碎石或沙滩后都要检查胎面是否嵌入砂粒，并在它被压进胎体之前清掉。

## 刹车：既是检查也是养护
反复踩下、松开，先在平地，再在斜坡。开始「踩得晚」或者需要更用力的刹车，是在告诉你机构磨损了或进了砂。清理咬合部位，再测一次。

除非厂商说明里写了，不要为了让它更顺而给刹车机构上油。油会吸砂，而砂正是当初把它磨坏的东西。

## 车架与连接处
车架用擦的，不要用水冲；重点看折叠关节和任何伸缩段。关节里的砂是让折叠变涩的原因，而涩的折叠就是那个会被弃用的折叠。布面与座兜见[如何清洁旅行推车](/guides/maintenance/stroller-how-to-clean)。

## 短到能坚持的周期
每周：转一遍轮子、在斜坡上踩一次刹车。每月：看折叠关节、看胎面。每季：充气胎查气压，存放前整体擦一遍。比这更长的周期，就会停止被执行。

## 延伸阅读
- [如何清洁旅行推车](/guides/maintenance/stroller-how-to-clean)
- [刹车与约束核对](/guides/risk/stroller-brake-and-restraint-checks)
- [轻量旅行推车](/guides/scenario/lightweight-travel-stroller)`,
  },
  {
    slug: "stroller-storage-and-off-season-care",
    title: "Storing a Stroller Off-Season",
    description:
      "How to put a stroller away so it comes back out the same: joint position, tyre pressure, fabric and the one storage choice that causes flat spots.",
    keywords: ["stroller storage", "storing stroller long term", "stroller off season care", "stroller flat spot tyre"],
    zhTitle: "换季存放推车的正确方式",
    zhDescription:
      "怎样把推车收起来，才能下次拿出来还是原样：折叠状态、胎压、布面，以及唯一会造成压出平点的存放选择。",
    zhKeywords: ["推车存放", "推车长期存放", "推车换季养护", "推车轮胎平点"],
    topic: "maintenance",
    topicOrder: 13,
    cover: "https://store.balancebiketoddler.com/stroller/Ingenuity/Rank_Similar_ASIN_B07P1YSC18_Ingenuity%203D%20Mini%20Convenience%20Stroller/images/primary.jpg",
    en: `A stroller that is stored badly comes back with problems that were not there when it went away. Almost all of them are avoidable with four decisions.

## Decide the fold state deliberately
Leave it folded, or leave it open. What you should not do is leave it half-folded under other objects, which is how joints take a set and how a fold mechanism gets bent. If space forces a fold, fold it fully and lock it.

An open stroller takes more room but keeps the fold joint in its designed rest position, which is the better choice for anything stored longer than a few weeks.

## Take the load off the tyres
Air tyres lose pressure over a season, and a deflated tyre sitting under load flat-spots at the contact patch. Foam and solid tyres do the same thing more slowly, which is why this applies to every tyre type.

Either store the stroller with the wheels off the ground, or store it unloaded and accept a pressure check before the first walk. What you should not do is leave bags in the basket for months.

## Fabric: dry, then ventilated
Seat fabric stored damp grows mildew, and mildew in a seat is not removable by wiping. The order matters: clean it, let it dry completely open and unclothed by a cover, then store it somewhere with air movement. A sealed bag over damp fabric is the one combination that reliably produces a smell you cannot get out. The cleaning steps themselves are in [how to clean a travel stroller](/guides/maintenance/stroller-how-to-clean).

## Where not to store it
- **A hot loft or a car boot in summer.** Heat degrades plastic joints and tyre rubber.
- **Against a damp external wall.** Condensation forms on the coldest surface, which will be the frame.
- **Under anything heavy.** Weight on an open frame is how a canopy hoop or a handlebar gets bent.

## Bringing it back out
Give it a full check rather than a quick look: spin the wheels for bearing noise, set and release the brake, inspect the harness webbing for stiffness or fraying, and check tyre pressure. The full sequence is in [wheel and brake care](/guides/maintenance/stroller-wheel-and-brake-care). A stroller that has been away for a season should be treated as one you have not yet checked, not one you already know.

## Next
- [How to clean a travel stroller](/guides/maintenance/stroller-how-to-clean)
- [Wheel and brake care](/guides/maintenance/stroller-wheel-and-brake-care)
- [Stroller safety tips](/guides/risk/stroller-safety-tips)`,
    zh: `存放不当的推车，回来时会带着「走之前没有的」问题。而这些问题几乎都能靠四个决定避开。

## 明确选择折叠状态
要么完全折起，要么完全展开。不该做的是半折着被别的东西压住——关节会因此「定形」，折叠机构会因此被压弯。如果空间逼着你要折，就折到底并锁住。

展开存放更占地方，但能让折叠关节处在设计时的静置位置；对存放超过几周的车，这是更好的选择。

## 让轮胎卸掉载荷
充气胎一季会掉压，而承压状态下瘪掉的轮胎会在接触点压出平点。发泡胎和实心胎会以更慢的方式出现同样的结果——所以这条对所有胎型都成立。

要么把轮子抬离地面存放，要么卸空存放、并接受第一次出门前查一次气压。不该做的是让篮筐里的东西在里面放几个月。

## 布面：先干，再通风
潮湿存放的座布会长霉，而座兜上的霉不是靠擦能去掉的。顺序很重要：先清洁，再在完全展开、不套罩的状态下彻底晾干，然后放到有空气流动的地方。把潮布面封进袋子，是唯一能稳定制造出「洗不掉的味道」的组合。清洁步骤本身见[如何清洁旅行推车](/guides/maintenance/stroller-how-to-clean)。

## 不该存放的地方
- **夏天闷热的阁楼或后备箱。** 高温会让塑料关节与轮胎橡胶劣化。
- **贴着潮湿的外墙。** 冷凝会出现在最冷的表面上，而那通常是车架。
- **压在任何重物下面。** 展开的车架上压重物，是车篷拱杆或扶手被压弯的原因。

## 重新取出时
做一次完整检查，而不是随便看一眼：转轮子听轴承声、踩下并松开刹车、检查安全带的织带是否发硬或起毛、查轮胎气压。完整流程见[轮子与刹车养护](/guides/maintenance/stroller-wheel-and-brake-care)。存放了一季的推车，应当按「还没检查过的车」对待，而不是「已经了解的车」。

## 延伸阅读
- [如何清洁旅行推车](/guides/maintenance/stroller-how-to-clean)
- [轮子与刹车养护](/guides/maintenance/stroller-wheel-and-brake-care)
- [推车安全要点](/guides/risk/stroller-safety-tips)`,
  },
];

/* ------------------------------------------------------------------ */

function wordCount(text) {
  return (String(text || "").match(/[A-Za-z0-9']+/g) || []).length;
}

/**
 * The channel pages that exist: /guides/<topic>. "best" is deliberately
 * absent — its guides are the commercial cluster, not one of the six topic
 * channel pages (see GUIDE_TOPIC_IDS vs the channel vocabulary in
 * src/lib/guidesCategoryTopic.ts). A link to /guides/best is a 404.
 */
const CHANNEL_TOPICS = new Set(["beginner", "scenario", "budget", "risk", "special", "maintenance"]);

/**
 * Stem budget for a <title>.
 *
 * buildDocumentTitle() appends " | BalanceBikeToddler" (21 chars) and, when the
 * result exceeds TITLE_MAX_CHARS (60), cuts the STEM at a word boundary. A stem
 * over 39 therefore publishes a truncated title: the first draft of this batch
 * shipped "Stroller Price Tiers: What Each Step Up | BalanceBikeToddler" and
 * "Stroller Brake and Restraint | BalanceBikeToddler". Checking the raw stem
 * length here is the only way to catch it before the CMS row exists.
 */
const TITLE_STEM_MAX = 60 - " | BalanceBikeToddler".length;

/** Local checks that run before anything touches the network. */
function selfCheck(topicBySlug, publishedSlugs) {
  const problems = [];
  const seen = new Set();
  // Links inside this batch resolve against the batch itself, so a cross-link
  // between two new articles must not be reported as unpublished.
  for (const a of ARTICLES) topicBySlug.set(a.slug, a.topic);
  for (const a of ARTICLES) {
    if (seen.has(a.slug)) problems.push(`${a.slug}: duplicate slug in this batch`);
    seen.add(a.slug);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(a.slug)) problems.push(`${a.slug}: slug is not kebab-case`);
    for (const f of FORBIDDEN_EN) {
      if (a.en.toLowerCase().includes(f)) problems.push(`${a.slug}: EN contains forbidden claim "${f}"`);
    }
    for (const f of FORBIDDEN_ZH) {
      if (a.zh.includes(f)) problems.push(`${a.slug}: ZH contains forbidden claim "${f}"`);
    }
    if (wordCount(a.en) < 350) problems.push(`${a.slug}: EN only ${wordCount(a.en)} words (min 350)`);
    if (a.zh.length < 500) problems.push(`${a.slug}: ZH only ${a.zh.length} chars (min 500)`);
    if (!/^##\s/m.test(a.en) || !/##/.test(a.zh)) problems.push(`${a.slug}: missing section headings`);
    if (a.title.length > TITLE_STEM_MAX) {
      problems.push(`${a.slug}: title stem ${a.title.length} chars — truncates (max ${TITLE_STEM_MAX} before the brand suffix)`);
    }
    if (a.description.length > 158) problems.push(`${a.slug}: description ${a.description.length} chars (>158)`);
    // The Chinese SEO block is not optional: prerender gates the /zh edition on
    // zh.title + zh.content, so an undefined zhTitle silently drops the whole
    // translated URL from the site (and from zh-routes.json / hreflang).
    if (!String(a.zhTitle || "").trim()) problems.push(`${a.slug}: zhTitle is empty — /zh edition would not be built`);
    if (!String(a.zhDescription || "").trim()) problems.push(`${a.slug}: zhDescription is empty`);
    if (String(a.zhDescription || "").length > 158) problems.push(`${a.slug}: zhDescription ${a.zhDescription.length} chars (>158)`);
    if (!Array.isArray(a.zhKeywords) || !a.zhKeywords.length) problems.push(`${a.slug}: zhKeywords is empty`);
    if (!Array.isArray(a.keywords) || !a.keywords.length) problems.push(`${a.slug}: keywords is empty`);
    for (const [field, list] of [["keywords", a.keywords], ["zhKeywords", a.zhKeywords]]) {
      if (Array.isArray(list) && list.length > 5) problems.push(`${a.slug}: ${field} has ${list.length} entries (>5)`);
    }
    // Every internal link must resolve to a published slug, a sibling article in
    // this batch, or a topic channel — AND the topic segment must be the topic
    // that article is actually filed under.
    //
    // The first version of this check compared only the SLUG. That let eight
    // links to /guides/special/stroller-how-to-clean through, while the article
    // is filed under maintenance: the slug existed, so the check passed, and the
    // batch was ready to publish a 404 from four different pages. The URL is
    // /guides/<topic>/<slug> and BOTH segments have to be right.
    const targets = [...String(a.en).matchAll(/\]\((\/guides\/[^)]+)\)/g), ...String(a.zh).matchAll(/\]\((\/guides\/[^)]+)\)/g)]
      .map((m) => m[1]);
    for (const t of targets) {
      const seg = t.replace(/^\/guides\//, "").replace(/\/$/, "").split("/");
      if (seg.length === 1) {
        if (!CHANNEL_TOPICS.has(seg[0])) problems.push(`${a.slug}: link target channel does not exist -> ${t}`);
        continue;
      }
      const [topic, slug] = seg;
      const actual = topicBySlug.get(slug);
      if (!actual && !publishedSlugs.has(slug)) {
        problems.push(`${a.slug}: link target not published -> ${t}`);
      } else if (actual && actual !== topic) {
        problems.push(`${a.slug}: link topic "${topic}" != article topic "${actual}" -> ${t}`);
      }
    }
  }
  return problems;
}

async function request(path, init = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: adminHeaders({ Accept: "application/json", ...(init.headers || {}) }),
  });
  const text = await res.text();
  let body = null;
  try { body = JSON.parse(text); } catch { body = { raw: text.slice(0, 300) }; }
  if (!res.ok) throw new Error(`${path} -> HTTP ${res.status} ${JSON.stringify(body).slice(0, 300)}`);
  return body;
}

function unwrap(payload) {
  if (Array.isArray(payload)) return payload;
  for (const key of ["data", "records", "rows", "items"]) {
    const v = payload?.[key];
    if (Array.isArray(v)) return v;
  }
  return null;
}

function buildRecord(a) {
  const now = new Date().toISOString();
  return {
    id: `guide-2026-${a.slug}`,
    slug: a.slug,
    category: a.topic,
    status: "published",
    taxonomy: {
      productCategory: "stroller",
      topicCategory: a.topic,
      topicOrder: a.topicOrder,
      hub: "all_guides",
      hierarchyPath: ["stroller", "all_guides", a.topic],
      pinOrder: 0,
    },
    seo: {
      en: { title: a.title, description: a.description, keywords: a.keywords },
      zh: {
        title: a.zhTitle,
        description: a.zhDescription,
        keywords: a.zhKeywords,
      },
    },
    en: { title: a.title, content: a.en },
    zh: { title: a.zhTitle, content: a.zh },
    imageUrl: a.cover,
    publishedAt: now.slice(0, 10),
    updatedAt: now,
  };
}

async function main() {
  // The token gates WRITES only. `GET /api/cms/guides` is public (verified: 200
  // without a token), and `POST /api/cms/guides/save` is 403 without one, so a
  // dry run — the whole point of which is to be safe to run anywhere — was
  // being blocked by a credential it never uses. Require it only where it is
  // actually consumed.
  if (!TOKEN && APPLY) {
    console.error("CMS_ADMIN_ALL_TOKEN is required for --apply (POST /api/cms/guides/save returns 403 without it).");
    process.exit(1);
  }

  const payload = await request(`/api/cms/guides?cb=${Date.now()}`);
  const records = unwrap(payload);
  if (!records) { console.error("Unexpected CMS response shape"); process.exit(1); }

  const published = records.filter((r) => String(r.status || "published") === "published");
  const bySlug = new Map(published.map((r) => [r.slug, r]));
  const publishedSlugs = new Set(published.map((r) => r.slug));
  console.log(`CMS guides: ${records.length} total, ${published.length} published`);

  if (VERIFY) {
    let bad = 0;
    for (const a of ARTICLES) {
      const r = bySlug.get(a.slug);
      if (!r) { console.error(`[MISSING] ${a.slug}`); bad++; continue; }
      const okEn = String(r.en?.content || "").includes("##");
      const okZh = String(r.zh?.content || "").includes("##");
      const okTax = r.taxonomy?.productCategory === "stroller" && r.taxonomy?.topicCategory === a.topic;
      const okSeo = Boolean(r.seo?.en?.title && r.seo?.zh?.title);
      if (!(okEn && okZh && okTax && okSeo)) { console.error(`[FAIL] ${a.slug} en=${okEn} zh=${okZh} tax=${okTax} seo=${okSeo}`); bad++; }
      else console.log(`[ok] ${a.slug}  en=${wordCount(r.en.content)}w zh=${String(r.zh.content).length}c`);
    }
    // Report the resulting combination counts.
    const counts = new Map();
    for (const r of published) {
      const k = `${r.taxonomy?.productCategory}/${r.taxonomy?.topicCategory}`;
      counts.set(k, (counts.get(k) || 0) + 1);
    }
    console.log("\nstroller combinations after fill:");
    for (const t of ["beginner", "scenario", "budget", "risk", "special", "maintenance", "best"]) {
      const n = counts.get(`stroller/${t}`) || 0;
      console.log(`  ${t.padEnd(14)} ${n}  ${n >= 3 ? "indexable" : "STILL BELOW 3"}`);
    }
    process.exit(bad ? 1 : 0);
  }

  const problems = selfCheck(
    new Map(published.map((r) => [r.slug, String(r.taxonomy?.topicCategory || r.category || "").trim()])),
    publishedSlugs,
  );
  if (problems.length) {
    console.error(`Refusing to write — ${problems.length} copy problem(s):`);
    for (const p of problems.slice(0, 40)) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log(`copy self-check OK — ${ARTICLES.length} articles, grounded, no forbidden claims, all links resolve`);

  const planned = [];
  for (const a of ARTICLES) {
    if (publishedSlugs.has(a.slug)) { console.log(`[skip] ${a.slug} — already published`); continue; }
    const rec = buildRecord(a);
    planned.push({ slug: a.slug, rec });
    console.log(`[plan] ${a.slug.padEnd(44)} stroller/${a.topic}  en=${wordCount(a.en)}w zh=${a.zh.length}c`);
  }

  if (!planned.length) { console.log("Nothing to do — all 7 already exist."); return; }
  if (!APPLY) { console.log(`\nDry run: ${planned.length} record(s) would be created. Re-run with --apply.`); return; }

  const backupDir = join(process.cwd(), ".workbuddy", "tmp", "guides-fill-b1");
  mkdirSync(dirname(join(backupDir, "x")), { recursive: true });
  mkdirSync(backupDir, { recursive: true });
  const backupFile = join(backupDir, `created-${Date.now()}.json`);
  writeFileSync(backupFile, JSON.stringify(planned.map((p) => p.rec), null, 2));
  console.log(`backup of created records: ${backupFile}`);

  let ok = 0;
  for (const { slug, rec } of planned) {
    const saved = await request("/api/cms/guides/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rec),
    });
    if (!saved?.data?.saved) { console.error(`[FAIL] ${slug}: ${JSON.stringify(saved).slice(0, 200)}`); process.exitCode = 1; }
    else { ok++; console.log(`[ok] ${slug}`); }
  }
  console.log(`\nCreated ${ok}/${planned.length} guide(s).`);
}

main().catch((err) => { console.error(err); process.exit(1); });