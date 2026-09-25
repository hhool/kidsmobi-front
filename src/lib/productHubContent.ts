/**
 * Category-hub editorial content (single source, P1 SEO round).
 *
 * Used by BOTH:
 *  - scripts/prerender-pages.ts  (static hub HTML)
 *  - src/App.tsx                 (hydrated hub route parity)
 *
 * Every hub page (7 kebab-case directories) renders this intro + FAQ so the
 * hydrated DOM matches what the crawler first saw, and no hub ships thin.
 * Copy is category-level buying guidance — no invented test data, no brand
 * claims we cannot back from the lab checklist.
 */

export interface HubFaq {
  q: string;
  a: string;
}

export interface HubContent {
  intro: string[];
  faqs: HubFaq[];
}

export const CATEGORY_HUB_CONTENT: Record<string, HubContent> = {
  strollers: {
    intro: [
      "A stroller is the piece of kid mobility gear you will touch every single day, so the differences that matter are the unglamorous ones: how it folds one-handed with a child on your hip, whether the handlebar height survives two caregivers of different heights, and how the suspension soaks up cracked sidewalks instead of shaking the nap out of a sleeping toddler. Our lab checklist scores every model below on those daily-use dimensions first, with styling and brand story deliberately last.",
      "The right category depends on your routine. Jogging strollers earn their larger footprint with three-wheel stability and real tire suspension for park and trail pace; travel strollers win on cabin gates and trunk space when the frame folds under umbrella size; double configurations trade width or length for keeping twins or siblings in one push. Weight limits, fold dimensions, and brake style are listed on every card so you can filter by the constraints that actually bind your day.",
    ],
    faqs: [
      {
        q: "Jogging, travel, or full-size stroller — which should I buy first?",
        a: "Buy for the route you push most. If your week is sidewalks, transit, and car trunks, start with a compact travel or full-size model; add a jogging stroller only when you actually run or walk rough terrain with it. One well-matched stroller beats two compromises.",
      },
      {
        q: "How much should a daily-use stroller weigh?",
        a: "Most caregivers are comfortable lifting 15-20 lb into a trunk. Below ~13 lb you are in travel-stroller territory with lighter frames and smaller wheels; above ~25 lb you are buying suspension and seat comfort at the cost of every staircase between you and the door.",
      },
      {
        q: "When does a stroller need a newborn-compatible recline?",
        a: "If you will push a baby under roughly six months, the seat needs a near-flat recline or a car-seat adapter, because young infants do not have the trunk control to sit upright over bumps. Models without a flat recline list a minimum age — check it before, not after, checkout.",
      },
    ],
  },
  "balance-bikes": {
    intro: [
      "A balance bike teaches the skill that actually matters — balancing — by removing the part that slows learning down: pedals. Kids scoot, glide, and catch themselves with their own feet, so the bike's job is to disappear underneath them. That is why our checklist weighs seat height range, bike weight, and steering geometry far above accessory lists: a child who can plant both feet flat and lift the bike alone learns in weeks what training wheels often drag out over a season.",
      "Fit beats features at this age. Measure your child's inseam and match it against the minimum seat height on each card; a 12-inch wheel bike with a low seat suits most 2-year-olds, while longer legs need an adjustable post that keeps up. Weight is the other silent deal-breaker — a bike near a third of the child's body weight gets abandoned in the grass, while a sub-7 lb frame gets ridden daily.",
    ],
    faqs: [
      {
        q: "What age should a child start on a balance bike?",
        a: "Most children are ready between 18 months and 2 years, once they walk steadily. The reliable signal is inseam, not birthday: if your child can stand flat-footed over the lowest seat setting, they can ride. Starting earlier with a light, low-seat model is easier than unlearning training wheels later.",
      },
      {
        q: "Do balance bikes need brakes?",
        a: "At gliding speeds on flat ground, a child's shoes are the most effective brake they have, and most 12-inch models skip hand brakes for good reason. If you choose a model with a rear brake for hills or faster riders, make sure the lever is small enough for a toddler's hand to actually reach and pull.",
      },
      {
        q: "How does a balance bike transition to a pedal bike?",
        a: "Usually directly, and often by age 3-4 with no training wheels. A child who has mastered gliding already owns the balance skill; adding pedals is a small step. Many families fit pedals to the same frame or move up once the child outgrows the seat height range.",
      },
    ],
  },
  "kids-bikes": {
    intro: [
      "First pedal bikes fail for mechanical reasons long before kids lose interest: brakes a small hand cannot modulate, geometry that puts the rider over the bars, frames heavy enough to make every hill a defeat. Our scoring leans on the measurable side of those failures — dual hand-brake reach, standover height, crank length, and total weight — because a bike that fits is the single strongest predictor a child rides often and safely.",
      "Age labels on kids bikes are notoriously loose, so work from two numbers instead: standover clearance (an inch or two over the top tube) and inside-leg reach to the pedals at their lowest point. From 14-inch wheels for fledgling pedal riders to 20-inch and 24-inch rigs for school-age riders, every card below lists the size-relevant specs our lab extracts, plus training-wheel compatibility where the frame supports it.",
    ],
    faqs: [
      {
        q: "What size kids bike does my child need?",
        a: "Size by inseam and standover height, not age. Your child should straddle the top tube with feet flat and 1-2 inches of clearance, and reach the pedals with a slight knee bend. Wheel sizes (14, 16, 18, 20, 24 inch) are a rough proxy — the fit numbers on each card are the real test.",
      },
      {
        q: "Are training wheels a good idea?",
        a: "They solve stability but teach leaning the wrong way, which is why many riders who mastered a balance bike skip them entirely. If your child is moving straight from no-bike experience, short-term training wheels on a correctly sized bike are fine — plan to remove them within a season rather than letting them become permanent.",
      },
      {
        q: "Hand brakes or coaster brakes for a first pedal bike?",
        a: "Prefer a bike with both. Coaster (back-pedal) brakes work instinctively but cost the rider the ability to reposition pedals, while a properly reached hand brake builds the skill every later bike assumes. US safety rules cap the lever reach for young children — all specs on the card note which braking setup the frame carries.",
      },
    ],
  },
  "kids-scooters": {
    intro: [
      "Scooters are the easiest win in kid mobility: near-zero learning curve, light enough to carry when enthusiasm runs out, and small enough to live by the front door. The trade-offs hide in the details our checklist scores — deck height (lower is steadier for beginners), wheel size and material (bigger polyurethane wheels swallow sidewalk cracks that stop small plastic ones dead), and for electric models, the throttle and brake relationship that decides whether a 6-year-old can actually manage the power band.",
      "Choose the format by rider age and route. Three-wheel kick scooters with lean-to-steer front ends suit ages 2-5 and hallway storage; two-wheel folding kick scooters take over from roughly age 6 and survive school-run duty for years. Electric scooters are a real category with real responsibility: check the listed top speed, brake type, and minimum age against your child's maturity, and treat helmet rules as non-negotiable from the first ride.",
    ],
    faqs: [
      {
        q: "Three-wheel or two-wheel scooter for a beginner?",
        a: "Under age 5, start three-wheel: the wide front axle and lean-to-steer geometry let a small child balance at walking speed without thinking about it. Move to two wheels when they outgrow the deck weight limit — usually the same year their coordination makes the switch boring rather than scary.",
      },
      {
        q: "Are kids electric scooters safe, and what should I check?",
        a: "They are safe when the spec matches the rider. Before buying, check three lines on the card: top speed (under ~10 mph for elementary-age riders), brake type (rear fender or hand brake the child can actually operate), and the manufacturer's minimum age and weight limit. Add a helmet from day one and flat, supervised routes until braking is automatic.",
      },
      {
        q: "What scooter wheel size rolls best on rough sidewalks?",
        a: "Bigger and polyurethane. Wheels around 120 mm or larger glide over expansion joints and brick edges that stop 80 mm plastic wheels, and quality PU compound dampens the buzz instead of passing it to small wrists. If your routes are rough, wheel size is the spec to spend on.",
      },
    ],
  },
  "electric-cars": {
    intro: [
      "Kids electric ride-ons are the heaviest purchase in this category and the one with the most safety-critical engineering hidden under the body shell. Our checklist scores what matters and is easy to get wrong: battery and charger certification (look for UL-listed charging electronics, not just a CE mark on the sticker), remote-control override for parents, seatbelts that actually latch, and realistic runtime — because a 12V car that dies after 20 minutes is a toy that gets wheeled to the garage by week two.",
      "Voltage maps to age and terrain. 6V suits smooth indoor floors and the youngest drivers; 12V handles grass, gentle slopes, and most 3-5 year olds; 24V machines are for older kids on larger yards and carry speeds that deserve the same helmet discipline as a bicycle. Every card lists the drivetrain voltage, tested runtime factors, weight limit, and whether the model offers the two-speed and remote lockout features that make the first month of driving manageable for parents.",
    ],
    faqs: [
      {
        q: "12V or 24V — which ride-on car do I need?",
        a: "For ages 2-5 on pavement and level lawn, 12V is the sweet spot: enough torque for grass and gentle slopes without speeds that outrun a preschooler's judgment. Step up to 24V only for older children, bigger yards, or hilly terrain — and expect the extra speed to demand closer supervision.",
      },
      {
        q: "How long does a kids electric car run per charge?",
        a: "Realistic runtime at typical usage is 40-90 minutes depending on voltage, rider weight, and how much of the session is full-throttle on grass. Treat manufacturer maximums as lab-best-case; the runtime notes on each card reflect the factors that actually drain the pack.",
      },
      {
        q: "What safety features matter most on a ride-on car?",
        a: "In order: a parental remote with override (so you can stop the car regardless of what the steering wheel is doing), a working seatbelt, certified charging electronics, and a seatbelt-lockable two-speed setting for beginners. Style and sound effects are what kids notice; these four are what keep the first year uneventful.",
      },
    ],
  },
  "safety-seats": {
    intro: [
      "A car seat is the one product in this entire store where the purchase decision is genuinely safety-critical every single ride, which is why our scoring here is the strictest: crash-test performance records, side-impact protection structure, harness systems that adjust without re-threading, and installation hardware that survives real-world use — because a correctly chosen seat installed loosely protects far less than its test score implies.",
      "Fit runs the decision, in two directions at once. The seat must match the child today (height and weight limits define how long it lasts) and the vehicle it rides in (belt geometry, ISOFIX/LATCH anchor spacing, and the seat's footprint versus your back seat). Convertible seats span rear-facing toddlerhood into forward-facing preschool years; boosters finish the job by positioning the adult belt across strong hip and shoulder bones. The card specs split those limits out explicitly so you can buy for the years you actually need.",
    ],
    faqs: [
      {
        q: "How long should my child ride rear-facing?",
        a: "As long as the seat's rear-facing height and weight limits allow — most modern convertibles accommodate children well past age 2, and riding rear-facing keeps the crash loads on the shell instead of a young child's neck. Switch to forward-facing when your child's head or weight approaches the listed rear-facing maximum, not before.",
      },
      {
        q: "What is the difference between a convertible seat and a booster?",
        a: "A convertible seat has its own five-point harness and works rear- then forward-facing for toddlers and preschoolers. A booster has no harness — it lifts and guides the vehicle's adult belt to fit a bigger child's body. Children move to a booster only after outgrowing the harness seat's forward-facing limits, and stay in some form of booster until the adult belt alone fits correctly, typically around 4'9\" tall.",
      },
      {
        q: "ISOFIX/LATCH or seat-belt installation — which is safer?",
        a: "Installed correctly, both perform the same; installed incorrectly — which is common — the anchor systems differ. ISOFIX/LATCH connectors reduce the most common mistakes on seats that stay put, while belt installs win for tight three-across fits and older vehicles. Whichever you choose, pull the slack out until the seat moves less than an inch at the belt path, and re-check after every cleaning or seat swap.",
      },
    ],
  },
  "kids-tricycles": {
    intro: [
      "This directory gathers the in-between machines of early riding: tricycles that teach pedaling before balance, push-handle converts that let parents steer the toddler years, ride-on coupes that make indoors and patio their kingdom, and pull-along wagons that haul the whole outing. What they share is a stability-first geometry — three or four contact points instead of two — which is why they are usually the first independent ride a child masters, often before age two.",
      "Because the formats vary so much, our cards emphasize the conversion path and the exit age: how many stages a 4-in-1 trike actually converts through, the push-handle's height range for the adult doing the steering, weight limits on the wagon bed, and the footprint that decides whether it fits a balcony or a trunk. The goal is buying once: a machine that starts as a parent-pushed stroller substitute and ends as the child's own pedals, instead of three purchases chasing the same two years.",
    ],
    faqs: [
      {
        q: "Tricycle or balance bike first?",
        a: "They train different skills, so order matters less than sequencing both before a pedal bike. Trikes teach the pedaling motion and steering from about age 2; balance bikes teach coasting balance. Many families run both in the same season — pedals at the playground, glider on the sidewalk — and the two skills combine naturally on the first pedal bike.",
      },
      {
        q: "Are push-handle trikes worth it over a plain tricycle?",
        a: "If the trike will double as your stroller for park loops, yes: the parent handle with steering override turns the same purchase into eighteen months of daily use, then removes for the child's independent stage. For a child who already pedals confidently, the plain trike is cheaper and lighter — the handle would just be dead weight by the second summer.",
      },
      {
        q: "What weight limit should I look for in a pull-along wagon?",
        a: "Rate it by total load, not just the child: most wagons carry 50-150 lb including cargo, and family use loads fast with bags, water, and a second sibling. Check the listed capacity against your heaviest realistic outing, and note whether the handle folds — storage footprint is the spec wagon owners complain about most.",
      },
    ],
  },
};

/** Hub intro paragraphs + FAQ for a slug (empty arrays when unknown). */
export function getHubContent(slug: string): HubContent {
  return CATEGORY_HUB_CONTENT[slug] || { intro: [], faqs: [] };
}
