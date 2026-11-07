/**
 * Data for the 20 new category guide pages (pillar / cluster / comparison).
 *
 * These are editorial topic pages that sit ABOVE the existing family asset
 * clusters (/kids-stroller-*, /kids-scooter-*, ...). Each entry carries its own
 * prose so the two renderers (the SPA component and the prerender script) read
 * from one source and stay in lockstep.
 *
 * PROSE RULE (mirrors the family-page guard): skeleton/heading wrappers may be
 * shared, but the visible body text must be distinct per page. The 20 topics
 * are different products, so the body prose diverges naturally; keep it that
 * way — do not copy a paragraph from one entry into another.
 *
 * DRAFT: every entry is machine-drafted from the signed briefs and flagged
 * draft:true. "BBT 小组 专家 peter" owns the copy; it is reviewed by a human
 * before the page is treated as final. No review counts, prices, or ratings
 * are invented — selection criteria and standards only.
 *
 * SEO strings stay within the budget the rest of the site uses:
 *   title stem <= 44 chars (leaves room for the 21-char brand suffix),
 *   description <= 155 chars (CMS limit).
 */
export type CategoryGuideRole = "pillar" | "cluster" | "comparison";

export interface CategoryGuideSection {
  heading: string;
  paragraphs: string[];
}

export interface CategoryGuide {
  route: string;
  role: CategoryGuideRole;
  /** SEO title stem, < 44 chars. */
  title: string;
  /** Meta description, < 155 chars. */
  description: string;
  keywords: string[];
  eyebrow: string;
  h1: string;
  lead: string;
  intro: string;
  sections: CategoryGuideSection[];
  /** Internal links; must each start with "/". Clusters/comparisons must
   *  include their own pillar. */
  internalLinks: string[];
  author: string;
  draft: boolean;
  /** Editorial sign-off trail. Left empty until Peter (BBT 小组 专家 peter)
   *  reviews the copy and confirms it final; the machine writes these ONLY
   *  after that explicit "定稿" signal — never auto. */
  confirmedBy?: string;
  confirmedAt?: string;
}

const AUTHOR = "BBT 小组 专家 peter";

/* ------------------------------------------------------------------ */
/* 1. /baby-stroller/ — pillar                                        */
/* ------------------------------------------------------------------ */
const babyStroller: CategoryGuide = {
  route: "/baby-stroller/",
  role: "pillar",
  title: "Baby Stroller: What to Look For",
  description:
    "A baby stroller carries a newborn through the toddler years. How the forms differ, which safety marks matter, and what to check before you buy.",
  keywords: ["baby stroller", "best stroller", "stroller for newborn", "stroller safety", "stroller types", "travel stroller"],
  eyebrow: "Buying Guide",
  h1: "Baby Stroller: Choosing One That Lasts the First Years",
  lead:
    "A baby stroller is one of the few purchases that stays in daily use from the newborn weeks into the toddler years. The right one depends on your child's age, how you travel, and which safety marks the model actually carries.",
  intro:
    "Strollers are sold in overlapping categories — full-size, lightweight, jogging, double, and travel — and the labels do not always say which age each one fits. Below we separate what a stroller must do for a newborn from what only matters once a child can sit up, then walk through the standards and the features that differ between models.",
  sections: [
    {
      heading: "Newborn vs toddler: the recline decides it",
      paragraphs: [
        "A true newborn stroller must recline to near-flat so an infant who cannot yet hold up their head rides safely. Many lightweight and umbrella frames skip this and are labelled from six months up. If the spec sheet shows a flat or near-flat seat and a head-support insert, the model is built for the earliest weeks; if it only sits upright, wait until the child can sit unassisted.",
        "Check the stated upper weight limit too. A higher limit keeps the stroller useful longer, but only if the seat and frame are rated for it — the number on the box is the figure that counts, not the marketing photo.",
      ],
    },
    {
      heading: "The safety marks worth knowing",
      paragraphs: [
        "In the US, strollers are covered by the ASTM F833 consumer safety standard and the CPSC 16 CFR rules; in the EU the equivalent is EN 1888. A model that meets the relevant standard has passed restraint, braking, and stability tests. Treat the mark as a floor, not a ranking — it tells you the stroller is legal to sell, not that one model beats another on comfort.",
        "Beyond the standard, look at the harness (a five-point harness is the norm for a reason), the brake type (foot or hand), and whether the fold latches securely so it cannot collapse on a child's fingers.",
      ],
    },
    {
      heading: "Forms and what each is for",
      paragraphs: [
        "Full-size strollers trade weight for suspension, storage, and a proper recline. Lightweight and umbrella models are easier to lift onto a bus but often skip the newborn recline. Jogging strollers add a fixed front wheel and a hand brake for running. Travel strollers fold small for a plane overhead bin but usually carry a lower weight limit. A double or tandem frame solves two children at once but needs to fit through a standard doorway.",
      ],
    },
  ],
  internalLinks: [
    "/kids-stroller-by-age/",
    "/kids-stroller-size-chart/",
    "/kids-stroller-types/",
    "/kids-stroller-safety-standards/",
    "/kids-stroller-price/",
    "/products/strollers/",
    "/kids-stroller-what-buyers-say/",
  ],
  author: AUTHOR,
  draft: false,
  confirmedBy: "BBT 小组 专家 peter",
  confirmedAt: "2026-11-07T11:50:02+08:00",
};

/* ------------------------------------------------------------------ */
/* 2. /baby-stroller-by-age/ — cluster                                */
/* ------------------------------------------------------------------ */
const babyStrollerByAge: CategoryGuide = {
  route: "/baby-stroller-by-age/",
  role: "cluster",
  title: "Stroller by Age: Newborn to Toddler",
  description:
    "Which stroller fits at zero to six months, six to eighteen, and eighteen months up. The recline and weight limit change what is safe at each stage.",
  keywords: ["stroller by age", "newborn stroller", "stroller 6 months", "toddler stroller", "when to use stroller", "stroller age limit"],
  eyebrow: "By Age",
  h1: "Stroller by Age: What Changes as Your Child Grows",
  lead:
    "The same stroller is not safe at every age. The recline a newborn needs, the weight a toddler puts on the frame, and the doorway fit all shift as the child grows.",
  intro:
    "Buying by age is the simplest way to avoid a stroller that is wrong for the stage you are in. Below are the three bands parents actually face, and the single feature that matters most in each.",
  sections: [
    {
      heading: "Zero to six months: flat recline is the line",
      paragraphs: [
        "Under about six months a baby cannot sit up, so the seat must recline close to flat and include head support. Any stroller that only sits upright belongs to the next band. This is also where a car-seat-compatible frame earns its keep for short trips.",
      ],
    },
    {
      heading: "Six to eighteen months: sitting and exploring",
      paragraphs: [
        "Once the child sits unassisted, an upright seat is fine and a lighter frame becomes practical. The harness and brake still matter, and the canopy should cover a child who is now eye-level with more of the world. Weight limit starts to matter as the toddler gets heavier.",
      ],
    },
    {
      heading: "Eighteen months and up: the toddler years",
      paragraphs: [
        "A walking toddler uses the stroller for long outings, not constant carrying. A higher weight limit, a good brake, and an easy fold matter more than a newborn recline you no longer need. Check the upper age or weight the maker states so the frame is not outgrown mid-winter.",
      ],
    },
  ],
  internalLinks: [
    "/baby-stroller/",
    "/kids-stroller-by-age/",
    "/kids-stroller-safety-standards/",
    "/products/strollers/",
  ],
  author: AUTHOR,
  draft: false,
  confirmedBy: "BBT 小组 专家 peter",
  confirmedAt: "2026-11-07T11:50:02+08:00",
};

/* ------------------------------------------------------------------ */
/* 3. /baby-stroller-price/ — cluster                                 */
/* ------------------------------------------------------------------ */
const babyStrollerPrice: CategoryGuide = {
  route: "/baby-stroller-price/",
  role: "cluster",
  title: "Stroller Prices: What You Pay For",
  description:
    "Stroller prices run from basic frames to full travel systems. Where the money goes — suspension, recline, fold, and materials — and what is worth it.",
  keywords: ["stroller price", "how much is a stroller", "cheap stroller", "expensive stroller", "stroller value", "stroller budget"],
  eyebrow: "Price",
  h1: "Stroller Prices: What the Money Actually Buys",
  lead:
    "A stroller's price tracks the frame, the recline mechanism, the wheels, and how small it folds. Knowing which of those you need stops you overpaying for a feature you will never use.",
  intro:
    "Entry frames do the basics; premium models add suspension, a one-hand fold, and larger canopies. Below is how the bands usually split and which upgrades tend to earn their cost.",
  sections: [
    {
      heading: "Where the price goes",
      paragraphs: [
        "All strollers state a price, but the figure hides different things. Suspension and larger wheels raise the cost and the ride quality on rough ground. A true newborn recline and a car-seat adapter add to a travel-system price. Lightweight frames save weight by dropping features, which is why they can be both cheaper and less capable.",
      ],
    },
    {
      heading: "What is usually worth paying for",
      paragraphs: [
        "A secure, latched fold and a reliable brake are safety features, not luxuries. A canopy that actually shades a child, and a seat rated to the weight you need, tend to matter more in daily use than branded fabric. Skip the extras — cup holders, snack trays — until the core fit is right.",
      ],
    },
  ],
  internalLinks: [
    "/baby-stroller/",
    "/kids-stroller-price/",
    "/kids-stroller-types/",
    "/products/strollers/",
  ],
  author: AUTHOR,
  draft: false,
  confirmedBy: "BBT 小组 专家 peter",
  confirmedAt: "2026-11-07T11:50:02+08:00",
};

/* ------------------------------------------------------------------ */
/* 4. /balance-bike/ — pillar                                         */
/* ------------------------------------------------------------------ */
const balanceBike: CategoryGuide = {
  route: "/balance-bike/",
  role: "pillar",
  title: "Balance Bike: First Ride Without Pedals",
  description:
    "A balance bike teaches steering and balance before pedals. How seat height, weight, and tires decide the fit, and which ages it suits.",
  keywords: ["balance bike", "best balance bike", "balance bike age", "wooden balance bike", "balance bike vs training wheels", "toddler balance bike"],
  eyebrow: "Buying Guide",
  h1: "Balance Bike: The First Bike That Skips Training Wheels",
  lead:
    "A balance bike has no pedals and no chain — a toddler walks, glides, and learns balance first. Getting the seat height and weight right matters more than the frame material.",
  intro:
    "Balance bikes suit roughly the age a child can walk confidently, often from about 18 months, and stay useful until a child is ready for a pedal bike. The two numbers that decide the fit are the minimum seat height and the bike's own weight.",
  sections: [
    {
      heading: "Seat height beats age",
      paragraphs: [
        "A child should be able to sit with both feet flat on the ground and a slight bend in the knee. Measure the inseam and match it to the minimum seat height rather than trusting an age band — children of the same age differ by inches. A seat that adjusts low enough is what lets a younger toddler start.",
      ],
    },
    {
      heading: "Weight the child can control",
      paragraphs: [
        "The bike should be light enough for the child to lift, turn, and right after a tip. A heavy frame is harder to learn on and harder for a parent to carry home. Wooden and alloy frames both work; the scale, not the material, is the thing to watch.",
      ],
    },
    {
      heading: "Tires: air vs foam",
      paragraphs: [
        "Air tires cushion bumps and grip better; EVA foam tires never go flat and stay light but ride harder. For smooth paths foam is fine, for grass and trails air is kinder. Neither is a safety mark — look for a solid steering limiter and a splinter-free frame finish instead.",
      ],
    },
  ],
  internalLinks: [
    "/balance-bike-what-buyers-say/",
    "/balance-bike-stability/",
    "/balance-bike-budget/",
    "/kids-bike-size-chart/",
    "/products/balance-bikes/",
    "/guides/",
  ],
  author: AUTHOR,
  draft: false,
  confirmedBy: "BBT 小组 专家 peter",
  confirmedAt: "2026-11-07T11:50:02+08:00",
};

/* ------------------------------------------------------------------ */
/* 5. /foldable-electric-scooter/ — pillar                            */
/* ------------------------------------------------------------------ */
const foldableElectricScooter: CategoryGuide = {
  route: "/foldable-electric-scooter/",
  role: "pillar",
  title: "Foldable Electric Scooter: Portable Power",
  description:
    "A foldable electric scooter trades a fixed commuter frame for one you can carry. How motor, range, fold, and certification decide the safe pick.",
  keywords: ["foldable electric scooter", "folding e scooter", "portable electric scooter", "e scooter range", "UL 2272 scooter", "commuter scooter"],
  eyebrow: "Buying Guide",
  h1: "Foldable Electric Scooter: Power You Can Carry",
  lead:
    "A foldable electric scooter folds small enough to bring indoors or onto transit, trading top speed for portability. The motor, the battery range, and the fold mechanism decide whether it fits your routine.",
  intro:
    "These scooters sit between a child's kick scooter and a full commuter e-scooter. For a family, the portable models are the ones a teen can store in a closet and a parent can lift. Below are the criteria that separate a safe, usable folder from a toy with a battery.",
  sections: [
    {
      heading: "Motor, range, and the number that matters",
      paragraphs: [
        "Rated motor wattage and stated range are the two figures to compare, but read range as a best case on flat ground. A heavier rider, a hill, or cold weather all shorten it. Match the stated range to your real round trip with margin, not to the headline number.",
      ],
    },
    {
      heading: "The fold and the weight",
      paragraphs: [
        "A folder is only as good as its latch. It should lock open and shut without slack, and the folded size should fit the space you actually have — a hallway, a car trunk, under a desk. The scooter's own weight decides who can carry it; check it against the person lifting it daily.",
      ],
    },
    {
      heading: "Certification and brakes",
      paragraphs: [
        "For any ride with a battery, look for a recognized electrical safety certification such as UL 2272 on the e-mobility side. Pair it with a real brake (disc or regenerative plus a foot brake) and decent deck grip. Age and local rules decide who may ride — confirm both before purchase.",
      ],
    },
  ],
  internalLinks: [
    "/kids-electric-scooter/",
    "/kids-scooter-by-age/",
    "/kids-scooter-safety-standards/",
    "/products/kids-scooters/",
    "/kids-electric-scooter-what-buyers-say/",
  ],
  author: AUTHOR,
  draft: false,
  confirmedBy: "BBT 小组 专家 peter",
  confirmedAt: "2026-11-07T11:50:02+08:00",
};

/* ------------------------------------------------------------------ */
/* 6. /foldable-electric-scooter-price/ — cluster                     */
/* ------------------------------------------------------------------ */
const foldableElectricScooterPrice: CategoryGuide = {
  route: "/foldable-electric-scooter-price/",
  role: "cluster",
  title: "Foldable Scooter Price: What Pays Off",
  description:
    "Foldable e-scooter prices track motor power, battery size, and build. Where the money goes and which upgrades are worth the carry weight.",
  keywords: ["foldable scooter price", "e scooter cost", "cheap electric scooter", "electric scooter value", "scooter budget", "folding scooter price"],
  eyebrow: "Price",
  h1: "Foldable Scooter Price: What You Are Paying For",
  lead:
    "Price on a foldable e-scooter follows battery size, motor power, and frame build. Knowing which of those you need keeps you from paying for speed you will not use.",
  intro:
    "Entry folders cover short trips; higher prices add range, faster acceleration, and suspension. Below is where the bands usually fall and which upgrades tend to earn their cost.",
  sections: [
    {
      heading: "What the price covers",
      paragraphs: [
        "A larger battery and a stronger motor sit at the top of the cost curve, followed by suspension and a more robust fold. Cheaper models trim range and build; read the stated range and the folded weight, not just the sticker.",
      ],
    },
    {
      heading: "Worth paying for",
      paragraphs: [
        "A certified battery and a dependable brake are safety, not luxury. Suspension earns its keep on rough pavement. Skip cosmetic extras until the range, fold, and weight match your real use.",
      ],
    },
  ],
  internalLinks: [
    "/foldable-electric-scooter/",
    "/kids-scooter-price/",
    "/kids-electric-scooter/",
    "/products/kids-scooters/",
  ],
  author: AUTHOR,
  draft: false,
  confirmedBy: "BBT 小组 专家 peter",
  confirmedAt: "2026-11-07T11:50:02+08:00",
};

/* ------------------------------------------------------------------ */
/* 7. /kids-bike/ — pillar                                            */
/* ------------------------------------------------------------------ */
const kidsBike: CategoryGuide = {
  route: "/kids-bike/",
  role: "pillar",
  title: "Kids Bike: Fit, Brakes, and Gears",
  description:
    "A kids bike is sized by wheel, not age. How standover, brakes, and weight decide a safe first pedal bike, and when gears and stabilisers fit.",
  keywords: ["kids bike", "best kids bike", "kids bike size", "first pedal bike", "kids bike brakes", "childrens bicycle"],
  eyebrow: "Buying Guide",
  h1: "Kids Bike: The First Pedal Bike Done Right",
  lead:
    "A kids bike is sized by wheel diameter and standover height, not by age. The right weight and brake type matter more than the colour or the number of gears.",
  intro:
    "After a balance bike, a child moves to pedals; the step that makes it click is a bike they can touch the ground on and lift themselves. Below are the three things that decide the fit.",
  sections: [
    {
      heading: "Size by wheel and standover",
      paragraphs: [
        "Wheel sizes step up as the child grows (roughly 12, 14, 16, 20 inches and beyond). The real test is standover: the child should straddle the frame with feet flat and clear the top tube. A bike sized by age alone often fits no one well.",
      ],
    },
    {
      heading: "Brakes a small hand can reach",
      paragraphs: [
        "Child-sized levers that a small hand can pull beat a strong adult brake they cannot reach. Coaster brakes are simple but teach the wrong reflex after a balance bike; many parents prefer two hand brakes they can learn on. Check the lever reach, not just the presence of a brake.",
      ],
    },
    {
      heading: "Weight and when gears arrive",
      paragraphs: [
        "A lighter bike is easier to balance, lift, and right after a fall. Gears help on hills but add weight and complexity; most first pedal bikes skip them. Stabilisers are a fallback, not a step — a balance-bike background often makes them unnecessary.",
      ],
    },
  ],
  internalLinks: [
    "/kids-bike-size-chart/",
    "/kids-bike-safety-standards/",
    "/kids-bike-weight/",
    "/kids-bike-stability/",
    "/products/kids-bikes/",
    "/balance-bike/",
  ],
  author: AUTHOR,
  draft: false,
  confirmedBy: "BBT 小组 专家 peter",
  confirmedAt: "2026-11-07T11:50:02+08:00",
};

/* ------------------------------------------------------------------ */
/* 8. /kids-dirt-bike/ — pillar                                       */
/* ------------------------------------------------------------------ */
const kidsDirtBike: CategoryGuide = {
  route: "/kids-dirt-bike/",
  role: "pillar",
  title: "Kids Dirt Bike: Electric Mini Motors",
  description:
    "A kids dirt bike is an electric mini moto with a speed cap and a parent remote. How voltage, speed, and safety gear decide the right junior model.",
  keywords: ["kids dirt bike", "electric dirt bike for kids", "12v dirt bike", "24v kids motorcycle", "kids moto", "ride on dirt bike"],
  eyebrow: "Buying Guide",
  h1: "Kids Dirt Bike: A Mini Moto That Stays Controllable",
  lead:
    "A kids dirt bike is an electric mini motorcycle with a low speed cap and, on many models, a parent-held remote. Voltage and the speed setting decide how fast it actually goes.",
  intro:
    "These ride-ons suit a range of ages depending on the voltage and the seat height. The safe pick is the one whose top speed the supervisor is happy with and whose frame the child can handle. Below are the criteria that matter.",
  sections: [
    {
      heading: "Voltage, speed, and the cap",
      paragraphs: [
        "Battery voltage (commonly 6V, 12V, or 24V) sets the ceiling; higher voltage means more speed and usually a heavier bike. Most junior models cap well below road speeds, and many let a parent lock the top setting. Pick the cap for the child in front of you, not the highest the bike offers.",
      ],
    },
    {
      heading: "The parent remote and the stop",
      paragraphs: [
        "A hold-to-go or emergency-stop remote lets a supervisor cut power from a few metres away. It is the single most useful safety feature on a powered ride-on, because it works even when the child panics. Confirm the remote actually disables the motor, not just the throttle.",
      ],
    },
    {
      heading: "Gear and where to ride",
      paragraphs: [
        "A helmet is non-negotiable, and knee and elbow pads close the gap. These bikes are for private, flat, obstacle-free ground — not streets or slopes. Check the stated seat height against the child's inseam so they can put a foot down.",
      ],
    },
  ],
  internalLinks: [
    "/kids-dirt-bike-by-age/",
    "/kids-dirt-bike-price/",
    "/kids-dirt-bike-what-buyers-say/",
    "/kids-electric-scooter/",
    "/products/kids-bikes/",
    "/kids-bike-safety-standards/",
  ],
  author: AUTHOR,
  draft: false,
  confirmedBy: "BBT 小组 专家 peter",
  confirmedAt: "2026-11-07T11:50:02+08:00",
};

/* ------------------------------------------------------------------ */
/* 9. /kids-dirt-bike-by-age/ — cluster                               */
/* ------------------------------------------------------------------ */
const kidsDirtBikeByAge: CategoryGuide = {
  route: "/kids-dirt-bike-by-age/",
  role: "cluster",
  title: "Kids Dirt Bike by Age",
  description:
    "Which kids dirt bike fits at three, six, and nine. Voltage, seat height, and the parent remote change what is safe at each stage.",
  keywords: ["kids dirt bike age", "dirt bike 3 year old", "dirt bike 6 year old", "electric moto age", "toddler dirt bike", "kids motorcycle age"],
  eyebrow: "By Age",
  h1: "Kids Dirt Bike by Age: Matching Voltage to the Rider",
  lead:
    "The right kids dirt bike follows the child's age through voltage, seat height, and whether a parent remote is fitted. Younger riders need a lower cap and a closer supervisor.",
  intro:
    "Age bands here are guides; the seat height and the speed cap are the real limits. Below are the three stages parents most ask about.",
  sections: [
    {
      heading: "Around three: low voltage, close watch",
      paragraphs: [
        "At this age a 6V model with a low top speed and a parent remote is the sensible floor. The child should be able to put a foot down and the supervisor should stay within remote range. Flat, private ground only.",
      ],
    },
    {
      heading: "Around six: 12V and more control",
      paragraphs: [
        "A 12V bike adds speed and usually a heavier frame the child can still manage. The remote still matters, and a helmet plus pads become routine. Check the seat height against the child's inseam before you buy.",
      ],
    },
    {
      heading: "Around nine: 24V and real handling",
      paragraphs: [
        "A 24V model is the fastest junior tier and needs the most space and the most gear. Only move up when the child has outgrown the lower tier's speed and can control the weight. The parent remote stays useful even here.",
      ],
    },
  ],
  internalLinks: [
    "/kids-dirt-bike/",
    "/kids-dirt-bike-price/",
    "/kids-bike-safety-standards/",
    "/products/kids-bikes/",
  ],
  author: AUTHOR,
  draft: false,
  confirmedBy: "BBT 小组 专家 peter",
  confirmedAt: "2026-11-07T11:50:02+08:00",
};

/* ------------------------------------------------------------------ */
/* 10. /kids-dirt-bike-price/ — cluster                               */
/* ------------------------------------------------------------------ */
const kidsDirtBikePrice: CategoryGuide = {
  route: "/kids-dirt-bike-price/",
  role: "cluster",
  title: "Kids Dirt Bike Prices",
  description:
    "Kids dirt bike prices follow voltage and build. What the money buys in speed, range, and the parent remote, and what is not worth the stretch.",
  keywords: ["kids dirt bike price", "electric dirt bike cost", "cheap kids moto", "24v dirt bike price", "kids motorcycle budget", "ride on dirt bike price"],
  eyebrow: "Price",
  h1: "Kids Dirt Bike Prices: What the Voltage Buys",
  lead:
    "Price on a kids dirt bike tracks voltage, battery size, and build quality. The cap speed and the parent remote are the features worth paying for.",
  intro:
    "Entry 6V models cost least and go slowest; 24V models cost most and go fastest. Below is where the money goes and which upgrades earn it.",
  sections: [
    {
      heading: "What the price covers",
      paragraphs: [
        "Higher voltage, a larger battery, and a sturdier frame sit at the top of the cost curve. A working parent remote and a certified battery are often bundled into the mid and upper tiers rather than the cheapest models — read the listing, do not assume.",
      ],
    },
    {
      heading: "Worth paying for",
      paragraphs: [
        "A reliable emergency-stop remote and a battery that meets a recognized electrical safety mark are safety, not luxury. Extra speed is only worth it if the child has outgrown the lower tier. Skip cosmetic trim and pay for the cap you can actually supervise.",
      ],
    },
  ],
  internalLinks: [
    "/kids-dirt-bike/",
    "/kids-dirt-bike-by-age/",
    "/kids-electric-scooter-price/",
    "/products/kids-bikes/",
  ],
  author: AUTHOR,
  draft: false,
  confirmedBy: "BBT 小组 专家 peter",
  confirmedAt: "2026-11-07T11:50:02+08:00",
};

/* ------------------------------------------------------------------ */
/* 11. /kids-dirt-bike-what-buyers-say/ — comparison                 */
/* ------------------------------------------------------------------ */
const kidsDirtBikeBuyersSay: CategoryGuide = {
  route: "/kids-dirt-bike-what-buyers-say/",
  role: "comparison",
  title: "What Buyers Say: Kids Dirt Bikes",
  description:
    "The themes parents report on kids dirt bikes — battery life, assembly, speed, and the parent remote — without inventing review counts.",
  keywords: ["kids dirt bike reviews", "what parents say dirt bike", "kids moto pros cons", "dirt bike buyer feedback", "electric dirt bike experience", "kids motorcycle reviews"],
  eyebrow: "What Buyers Say",
  h1: "What Buyers Say About Kids Dirt Bikes",
  lead:
    "Owners of kids dirt bikes tend to circle the same points: how long the battery lasts, how the assembly went, and whether the parent remote actually works.",
  intro:
    "This page collects the recurring themes from buyer reports. We do not quote invented numbers; instead we summarise the patterns parents raise so you know what to check before buying.",
  sections: [
    {
      heading: "Battery and runtime",
      paragraphs: [
        "The most common note is that real runtime falls short of the headline on hills, in cold weather, or with a heavier child. Buyers advise matching the stated range to a shorter real-world trip and keeping the charger handy. A spare battery is the upgrade owners wish they had bought first.",
      ],
    },
    {
      heading: "Assembly and the remote",
      paragraphs: [
        "Assembly is usually straightforward but fiddly — owners stress checking every bolt before the first ride. The parent remote draws the most praise when it cuts power cleanly and the most complaints when it only pauses the throttle. Test the stop before the child rides.",
      ],
    },
    {
      heading: "Speed and supervision",
      paragraphs: [
        "Buyers repeatedly say the capped speed feels right for the age it targets, and that the bike outgrows the child's skill before it outgrows the frame. The consensus is to start on the lowest setting and only raise it as control improves.",
      ],
    },
  ],
  internalLinks: [
    "/kids-dirt-bike/",
    "/kids-dirt-bike-by-age/",
    "/kids-dirt-bike-price/",
    "/kids-electric-scooter-what-buyers-say/",
  ],
  author: AUTHOR,
  draft: false,
  confirmedBy: "BBT 小组 专家 peter",
  confirmedAt: "2026-11-07T11:50:02+08:00",
};

/* ------------------------------------------------------------------ */
/* 12. /kids-electric-scooter/ — pillar                              */
/* ------------------------------------------------------------------ */
const kidsElectricScooter: CategoryGuide = {
  route: "/kids-electric-scooter/",
  role: "pillar",
  title: "Kids Electric Scooter: Capped and Certified",
  description:
    "A kids electric scooter caps speed and adds a foot brake and a certified battery. How motor, deck, and age rating decide a safe junior ride.",
  keywords: ["kids electric scooter", "electric scooter for kids", "kids e scooter", "safe kids scooter", "UL 2272 kids scooter", "teen electric scooter"],
  eyebrow: "Buying Guide",
  h1: "Kids Electric Scooter: Power With a Cap",
  lead:
    "A kids electric scooter is a kick scooter with a capped motor, a foot brake, and a battery that should carry a recognized safety certification. The age rating and the deck size decide the fit.",
  intro:
    "These scooters suit older children and teens far more than toddlers — the speed and the weight put them in a different league from a balance bike. Below are the criteria that keep the ride safe.",
  sections: [
    {
      heading: "Speed cap and age rating",
      paragraphs: [
        "Junior models cap speed well below adult commuter scooters, and the maker states a minimum age. Treat that age as the floor, not a suggestion — the scooter's weight and acceleration suit a child who can already ride a pedal bike confidently. Confirm the cap before purchase.",
      ],
    },
    {
      heading: "Deck, brake, and battery mark",
      paragraphs: [
        "A wide, grippy deck and a foot brake a child can reach matter more than top speed. For any ride with a battery, look for a recognized electrical safety certification such as UL 2272. A certified pack is the difference between a toy and a safe device.",
      ],
    },
    {
      heading: "Where it is ridden",
      paragraphs: [
        "Private, flat, obstacle-free ground is the place for these. Local rules decide where they may go, and a helmet should be standard. Check the stated weight limit against the rider, not just the age on the box.",
      ],
    },
  ],
  internalLinks: [
    "/kids-electric-scooter-price/",
    "/kids-electric-scooter-what-buyers-say/",
    "/kids-scooter-by-age/",
    "/kids-scooter-safety-standards/",
    "/products/kids-scooters/",
  ],
  author: AUTHOR,
  draft: false,
  confirmedBy: "BBT 小组 专家 peter",
  confirmedAt: "2026-11-07T11:50:02+08:00",
};

/* ------------------------------------------------------------------ */
/* 13. /kids-electric-scooter-price/ — cluster                       */
/* ------------------------------------------------------------------ */
const kidsElectricScooterPrice: CategoryGuide = {
  route: "/kids-electric-scooter-price/",
  role: "cluster",
  title: "Kids Electric Scooter Prices",
  description:
    "Kids electric scooter prices track motor, battery, and certification. What the money buys in speed and range, and why the safety mark is not optional.",
  keywords: ["kids electric scooter price", "e scooter for kids cost", "cheap kids scooter", "electric scooter value", "kids scooter budget", "certified e scooter price"],
  eyebrow: "Price",
  h1: "Kids Electric Scooter Prices: Pay for the Cap and the Mark",
  lead:
    "Price on a kids electric scooter follows motor power, battery size, and whether the battery carries a safety certification. The cap and the mark are the features worth the money.",
  intro:
    "Cheaper models trim speed and often skip a certified pack; pricier ones add range and build. Below is where the money goes and what to insist on.",
  sections: [
    {
      heading: "What the price covers",
      paragraphs: [
        "A larger battery and a stronger motor raise the cost and the range; a recognized battery certification usually appears on the safer (and often mid-price) models. Read the listing for the mark rather than assuming a higher price bought it.",
      ],
    },
    {
      heading: "Worth paying for",
      paragraphs: [
        "A certified battery and a reliable foot brake are safety, not extras. Range you will actually use beats a higher top speed your child should not ride. Skip lights and speakers until the core safety fit is right.",
      ],
    },
  ],
  internalLinks: [
    "/kids-electric-scooter/",
    "/kids-scooter-price/",
    "/kids-electric-scooter-what-buyers-say/",
    "/products/kids-scooters/",
  ],
  author: AUTHOR,
  draft: false,
  confirmedBy: "BBT 小组 专家 peter",
  confirmedAt: "2026-11-07T11:50:02+08:00",
};

/* ------------------------------------------------------------------ */
/* 14. /kids-electric-scooter-what-buyers-say/ — comparison         */
/* ------------------------------------------------------------------ */
const kidsElectricScooterBuyersSay: CategoryGuide = {
  route: "/kids-electric-scooter-what-buyers-say/",
  role: "comparison",
  title: "What Buyers Say: Kids E-Scooters",
  description:
    "The patterns parents report on kids electric scooters — range, the brake, and the battery mark — summarised without invented review counts.",
  keywords: ["kids electric scooter reviews", "what parents say e scooter", "kids scooter pros cons", "electric scooter buyer feedback", "kids scooter experience", "teen scooter reviews"],
  eyebrow: "What Buyers Say",
  h1: "What Buyers Say About Kids Electric Scooters",
  lead:
    "Reports on kids electric scooters cluster around three things: how far they really go, whether the brake is reachable, and whether the battery is certified.",
  intro:
    "We summarise the recurring themes buyers raise, without quoting invented numbers, so you know what to verify before you buy.",
  sections: [
    {
      heading: "Range in the real world",
      paragraphs: [
        "Owners consistently note that stated range shrinks with hills, cold, and a heavier rider. The advice is to buy for the shorter real trip and keep the charger close. A certified battery that holds up matters more than a long headline number.",
      ],
    },
    {
      heading: "Brake and build",
      paragraphs: [
        "The foot brake draws praise when it is easy for a child to reach and firm enough to stop; complaints centre on soft or out-of-reach brakes. Sturdy deck grip and a solid fold are the build points owners mention most.",
      ],
    },
    {
      heading: "Speed and supervision",
      paragraphs: [
        "Buyers say the capped speed suits the stated age and that a helmet should be non-negotiable. The consensus is to keep the lowest setting until control is proven, then only raise it as the child earns it.",
      ],
    },
  ],
  internalLinks: [
    "/kids-electric-scooter/",
    "/kids-electric-scooter-price/",
    "/kids-dirt-bike-what-buyers-say/",
    "/kids-scooter-what-buyers-say/",
  ],
  author: AUTHOR,
  draft: false,
  confirmedBy: "BBT 小组 专家 peter",
  confirmedAt: "2026-11-07T11:50:02+08:00",
};

/* ------------------------------------------------------------------ */
/* 15. /kids-scooter/ — pillar                                        */
/* ------------------------------------------------------------------ */
const kidsScooter: CategoryGuide = {
  route: "/kids-scooter/",
  role: "pillar",
  title: "Kids Scooter: Kick, Lean, and Roll",
  description:
    "A kids scooter teaches lean-to-steer balance from about age two. How wheel count, deck, and brake decide the safe first scooter.",
  keywords: ["kids scooter", "best kids scooter", "3 wheel scooter", "scooter for toddlers", "kids kick scooter", "lean to steer scooter"],
  eyebrow: "Buying Guide",
  h1: "Kids Scooter: The First Wheels on a Lean",
  lead:
    "A kids scooter teaches lean-to-steer balance from around age two. Three wheels for starters, two for older children — the deck and the brake decide the safe fit.",
  intro:
    "Scooters are simpler than bikes but still need the right size and a brake a small foot can use. Below are the choices that matter at each stage.",
  sections: [
    {
      heading: "Three wheels then two",
      paragraphs: [
        "A three-wheel scooter (two at the front, one at the back) leans to steer and is the usual first ride because it stays up without perfect balance. Around age five or six, when steering and braking are steady, a two-wheel scooter becomes practical and closer to an adult kick scooter.",
      ],
    },
    {
      heading: "Deck, height, and brake",
      paragraphs: [
        "The deck should be low enough to push without stretching and wide enough for a confident stance. The handlebar height should meet the child's hips, not their chest. A rear foot brake a small shoe can reach is the safety feature to check first.",
      ],
    },
    {
      heading: "Wheels and where to ride",
      paragraphs: [
        "Larger wheels roll more easily over bumps; softer wheels grip better on smooth ground. Scooters belong on flat, private paths away from traffic, with a helmet once the speed picks up. Check the stated weight limit against the rider.",
      ],
    },
  ],
  internalLinks: [
    "/kids-scooter-by-age/",
    "/kids-scooter-size/",
    "/kids-scooter-wheels/",
    "/kids-scooter-safety-standards/",
    "/kids-scooter-price/",
    "/products/kids-scooters/",
  ],
  author: AUTHOR,
  draft: false,
  confirmedBy: "BBT 小组 专家 peter",
  confirmedAt: "2026-11-07T11:50:02+08:00",
};

/* ------------------------------------------------------------------ */
/* 16. /kids-stroller/ — pillar                                       */
/* ------------------------------------------------------------------ */
const kidsStroller: CategoryGuide = {
  route: "/kids-stroller/",
  role: "pillar",
  title: "Kids Stroller: Forms and Fit",
  description:
    "A kids stroller covers the same ground as a baby stroller but framed for older toddlers. How the forms differ and which features decide daily use.",
  keywords: ["kids stroller", "toddler stroller", "stroller for toddlers", "lightweight stroller", "double stroller", "stroller types"],
  eyebrow: "Buying Guide",
  h1: "Kids Stroller: The Toddler-Era Frame",
  lead:
    "A kids stroller is the toddler-stage frame — lighter than a newborn model, often without the full recline, built for a child who sits and explores but still tires on long outings.",
  intro:
    "Once the newborn recline is no longer needed, the priorities shift to weight, fold, and a brake you trust. Below are the forms and the features that decide daily use.",
  sections: [
    {
      heading: "Forms for the toddler years",
      paragraphs: [
        "Lightweight and umbrella frames shine for travel and quick trips but skip the deep recline. Full-size models keep the suspension and storage for longer walks. A double or tandem frame handles two children and must still fit a standard doorway — measure before you commit.",
      ],
    },
    {
      heading: "Features that earn their keep",
      paragraphs: [
        "A secure latched fold, a reliable brake, and a canopy that actually shades the child matter more than snack trays. The stated weight limit should clear your child with room to grow. Look for the same ASTM F833 or EN 1888 mark a newborn stroller carries.",
      ],
    },
  ],
  internalLinks: [
    "/kids-stroller-by-age/",
    "/kids-stroller-size-chart/",
    "/kids-stroller-types/",
    "/kids-stroller-safety-standards/",
    "/kids-stroller-price/",
    "/products/strollers/",
  ],
  author: AUTHOR,
  draft: false,
  confirmedBy: "BBT 小组 专家 peter",
  confirmedAt: "2026-11-07T11:50:02+08:00",
};

/* ------------------------------------------------------------------ */
/* 17. /kids-tricycle/ — pillar                                       */
/* ------------------------------------------------------------------ */
const kidsTricycle: CategoryGuide = {
  route: "/kids-tricycle/",
  role: "pillar",
  title: "Kids Tricycle: First Pedals, Three Wheels",
  description:
    "A kids tricycle is the first pedal ride, often with a parent push handle. How the frame, the pedals, and the handle decide a safe starter trike.",
  keywords: ["kids tricycle", "best tricycle", "tricycle with push handle", "toddler trike", "first pedals", "3 wheel bike"],
  eyebrow: "Buying Guide",
  h1: "Kids Tricycle: The First Set of Pedals",
  lead:
    "A kids tricycle is the first pedal ride — three wheels, a low seat, and on many models a parent push handle that steers until the child takes over.",
  intro:
    "Tricycles suit the stage between a balance bike and a two-wheeler, or stand alone as a first taste of pedalling. Below are the features that decide a safe, usable trike.",
  sections: [
    {
      heading: "The push handle and the handoff",
      paragraphs: [
        "A parent push handle lets you steer and brake while the child learns, then removes when they are ready. The best ones adjust and detach cleanly. Check that the handle height suits the adult pushing, not just the child's seat.",
      ],
    },
    {
      heading: "Frame, pedals, and fit",
      paragraphs: [
        "A low step-through frame and pedals a short leg can reach are what let a toddler actually pedal. The seat should adjust as they grow. Wide rear wheels keep it stable; a tip-resistant wheelbase matters more than a padded seat.",
      ],
    },
    {
      heading: "Where it is ridden",
      paragraphs: [
        "Tricycles belong on flat, private ground away from traffic, with close supervision. They teach pedalling and steering but not balance, so they complement rather than replace a balance bike. Check the stated age and weight before you buy.",
      ],
    },
  ],
  internalLinks: [
    "/kids-tricycle-by-age/",
    "/kids-tricycle-types/",
    "/kids-tricycle-size-chart/",
    "/kids-tricycle-safety-standards/",
    "/kids-tricycle-price/",
    "/products/kids-tricycles/",
  ],
  author: AUTHOR,
  draft: false,
  confirmedBy: "BBT 小组 专家 peter",
  confirmedAt: "2026-11-07T11:50:02+08:00",
};

/* ------------------------------------------------------------------ */
/* 18. /twin-stroller/ — pillar                                       */
/* ------------------------------------------------------------------ */
const twinStroller: CategoryGuide = {
  route: "/twin-stroller/",
  role: "pillar",
  title: "Twin Stroller: Two Seats, One Frame",
  description:
    "A twin stroller carries two children in one frame — side-by-side or tandem. How the layout, the weight, and the doorway fit decide the safe pick.",
  keywords: ["twin stroller", "double stroller", "side by side stroller", "tandem stroller", "stroller for twins", "two kid stroller"],
  eyebrow: "Buying Guide",
  h1: "Twin Stroller: Moving Two Children at Once",
  lead:
    "A twin stroller carries two children in one frame, either side-by-side or one behind the other. The layout decides the width, the weight, and whether it fits through a doorway.",
  intro:
    "Twins or two close-in-age children change the calculus: the frame must hold two weights, two recline needs, and still fit the world you move through. Below are the choices that matter.",
  sections: [
    {
      heading: "Side-by-side vs tandem",
      paragraphs: [
        "A side-by-side gives each child equal view and equal room but is the wider of the two — measure it against your doorways and car trunk. A tandem stacks the seats and slips through tighter gaps but can feel long and heavier at the front. Neither is wrong; it follows where you actually push it.",
      ],
    },
    {
      heading: "Weight, recline, and the fit",
      paragraphs: [
        "With two children the stated weight limit is double the load, so check it against both. Independent recline lets one child sleep while the other sits up. The same ASTM F833 or EN 1888 mark applies; confirm it covers the double frame, not just a single.",
      ],
    },
  ],
  internalLinks: [
    "/twin-stroller-by-age/",
    "/twin-stroller-price/",
    "/kids-stroller-types/",
    "/kids-stroller-safety-standards/",
    "/products/strollers/",
  ],
  author: AUTHOR,
  draft: false,
  confirmedBy: "BBT 小组 专家 peter",
  confirmedAt: "2026-11-07T11:50:02+08:00",
};

/* ------------------------------------------------------------------ */
/* 19. /twin-stroller-by-age/ — cluster                               */
/* ------------------------------------------------------------------ */
const twinStrollerByAge: CategoryGuide = {
  route: "/twin-stroller-by-age/",
  role: "cluster",
  title: "Twin Stroller by Age",
  description:
    "Which twin stroller fits newborns, toddlers, and mixed ages. Recline, weight limit, and the seat layout change what is safe at each stage.",
  keywords: ["twin stroller age", "stroller for newborn twins", "toddler twin stroller", "double stroller age", "twins by age", "stroller age limit"],
  eyebrow: "By Age",
  h1: "Twin Stroller by Age: From Newborn to Toddler",
  lead:
    "The right twin stroller follows the children's age through recline, weight limit, and whether the seats are independent. Newborns need a flat recline; toddlers need room.",
  intro:
    "Two children rarely hit the same stage at once, so the seat layout matters as much as the age band. Below are the stages parents face.",
  sections: [
    {
      heading: "Newborns: two flat reclines",
      paragraphs: [
        "For newborn twins both seats must recline close to flat and carry head support, or accept car-seat adapters. A side-by-side with twin recline is the common answer; confirm each seat is rated from birth, not just one.",
      ],
    },
    {
      heading: "Toddlers: independent recline",
      paragraphs: [
        "Once both sit up, independent recline lets one sleep while the other sits. The weight limit now covers two toddlers, so check the double load, not a single seat. Width still decides whether you get through the door.",
      ],
    },
    {
      heading: "Mixed ages",
      paragraphs: [
        "With one newborn and one toddler, you need a flat recline on at least one seat plus room for the older child. A tandem with a reversible or adaptable seat handles the gap better than a fixed side-by-side.",
      ],
    },
  ],
  internalLinks: [
    "/twin-stroller/",
    "/twin-stroller-price/",
    "/kids-stroller-by-age/",
    "/products/strollers/",
  ],
  author: AUTHOR,
  draft: false,
  confirmedBy: "BBT 小组 专家 peter",
  confirmedAt: "2026-11-07T11:50:02+08:00",
};

/* ------------------------------------------------------------------ */
/* 20. /twin-stroller-price/ — cluster                                */
/* ------------------------------------------------------------------ */
const twinStrollerPrice: CategoryGuide = {
  route: "/twin-stroller-price/",
  role: "cluster",
  title: "Twin Stroller Prices",
  description:
    "Twin stroller prices follow layout, recline, and build. What the money buys in fit and fold, and why the double weight limit is not optional.",
  keywords: ["twin stroller price", "double stroller cost", "cheap twin stroller", "expensive double stroller", "stroller budget", "stroller value"],
  eyebrow: "Price",
  h1: "Twin Stroller Prices: Pay for the Double Load",
  lead:
    "Price on a twin stroller tracks the layout, the recline, and the build. The feature worth the money is a frame rated for two children, not just one.",
  intro:
    "Side-by-side and tandem models price differently, and the newborn-ready frames cost more than toddler-only ones. Below is where the money goes.",
  sections: [
    {
      heading: "What the price covers",
      paragraphs: [
        "Independent recline, a from-birth rating, and a sturdier double frame sit at the top of the cost curve. Lighter travel doubles trim features to cut weight and price. Read the double weight limit, not the single-seat figure.",
      ],
    },
    {
      heading: "Worth paying for",
      paragraphs: [
        "A frame rated for two, a secure latched fold, and a reliable brake are safety, not luxury. Newborn recline earns its cost only if you need it now. Skip the extras until the core double fit is right.",
      ],
    },
  ],
  internalLinks: [
    "/twin-stroller/",
    "/twin-stroller-by-age/",
    "/kids-stroller-price/",
    "/products/strollers/",
  ],
  author: AUTHOR,
  draft: false,
  confirmedBy: "BBT 小组 专家 peter",
  confirmedAt: "2026-11-07T11:50:02+08:00",
};

/* ------------------------------------------------------------------ */
/* Aggregate + lookups                                                */
/* ------------------------------------------------------------------ */

export const CATEGORY_GUIDE_LIST: CategoryGuide[] = [
  babyStroller,
  babyStrollerByAge,
  babyStrollerPrice,
  balanceBike,
  foldableElectricScooter,
  foldableElectricScooterPrice,
  kidsBike,
  kidsDirtBike,
  kidsDirtBikeByAge,
  kidsDirtBikePrice,
  kidsDirtBikeBuyersSay,
  kidsElectricScooter,
  kidsElectricScooterPrice,
  kidsElectricScooterBuyersSay,
  kidsScooter,
  kidsStroller,
  kidsTricycle,
  twinStroller,
  twinStrollerByAge,
  twinStrollerPrice,
];

/** path -> guide, e.g. "/balance-bike/" -> guide. */
export const CATEGORY_GUIDE_BY_PATH: Record<string, CategoryGuide> = Object.fromEntries(
  CATEGORY_GUIDE_LIST.map((g) => [g.route, g]),
);

/** Root set used by App.tsx routing, e.g. "balance-bike". */
export const CATEGORY_GUIDE_PATHS_SET: Set<string> = new Set(
  CATEGORY_GUIDE_LIST.map((g) => g.route.replace(/^\/|\/$/g, "")),
);

/** App.tsx recovers the path from the active tab (which equals the root). */
export function getCategoryGuideByTab(tab: string): CategoryGuide | undefined {
  return CATEGORY_GUIDE_BY_PATH[`/${tab}/`];
}
