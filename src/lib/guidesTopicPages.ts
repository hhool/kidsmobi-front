/**
 * Guides topic pages (/guides/<topic>) — single source of truth.
 *
 * The route family is rendered twice: scripts/prerender-pages.ts writes the
 * static HTML from the configs below, and src/App.tsx hydrates onto them.
 * The SPA keeps the prerendered TDK when the static canonical matches the
 * current path (the channel-route early return in App.tsx), so both sides
 * publish the same values by construction — as long as both read them from
 * here.
 *
 * Consumers:
 *   - scripts/prerender-pages.ts  (filter page configs)
 *   - src/lib/pageKeywords.ts     (resolveRouteKeywords for /guides/<topic>)
 *   - scripts/check-spa-titles.ts (TDK expectations for the guard)
 *
 * Keep in lockstep with GUIDE_ROUTE_CATEGORY_IDS in src/App.tsx and
 * guideTopicCategory() in scripts/prerender-pages.ts.
 */

export type GuidesTopicPageId = "beginner" | "scenario" | "budget" | "risk" | "special" | "maintenance";

export interface GuidesTopicFaq {
  q: string;
  a: string;
}

export interface GuidesTopicPage {
  /** Visible <h1>. */
  h1: string;
  /** Full <title> override (already carries the brand suffix, <= 65 chars). */
  fullTitle: string;
  /** Meta description (<= 155 chars). */
  description: string;
  introHeading: string;
  introParagraphs: string[];
  faqs: GuidesTopicFaq[];
  keywords: Record<"en" | "zh", string[]>;
}

export const GUIDES_TOPIC_PAGES: Record<GuidesTopicPageId, GuidesTopicPage> = {
  beginner: {
    h1: "Beginner Guides: Start Here",
    fullTitle: "Beginner Guides for First-Time Buyers | BalanceBikeToddler",
    description:
      "Start-to-finish buying guides for first-time balance bike, kids bike, and stroller shoppers: sizing, safety standards, and age fit explained.",
    introHeading: "Where should a first-time buyer start?",
    introParagraphs: [
      "A first purchase usually starts with three unknowns: which size actually fits the child today, which safety claims are backed by a standard, and which features will still matter in six months. The beginner guides answer those in order, so the shortlist narrows before any product page is opened.",
      "Each guide follows the same structure: a direct answer up front, the reasoning and measurements behind it, and a source check at the end. That keeps the advice comparable across guides instead of hiding a different method inside every article.",
      "If you already know the category you want, jump straight to a product hub below; if you are still deciding between a balance bike, a tricycle, or a stroller, start with the sizing guide first.",
    ],
    faqs: [
      {
        q: "What should a first-time buyer check first?",
        a: "Fit comes first: seat height range against the child's inseam, then the safety standard a product claims, then the features that match the family routine.",
      },
      {
        q: "Do these guides assume any prior knowledge?",
        a: "No. Each guide explains the terms it uses and links to the standards it cites, so a first-time buyer can follow every step without extra research.",
      },
    ],
    keywords: {
      en: ["balance bike guide", "balance bike buying guide", "first balance bike", "balance bike for beginners", "kids bike guide"],
      zh: ["平衡车指南", "平衡车选购", "第一辆平衡车", "新手平衡车"],
    },
  },
  scenario: {
    h1: "Riding Scenarios: Match the Bike to the Ground",
    fullTitle: "Where & How to Ride: Balance Bike Scenarios | BalanceBikeToddler",
    description:
      "Balance bike guides by riding scenario: pavement, parks, grass, gravel and indoors — how each surface changes what matters in tires and frame weight.",
    introHeading: "Which surface will your rider actually see?",
    introParagraphs: [
      "A balance bike is surface-sensitive: the bike that glides on a basketball court becomes a push on loose grass or gravel. The guides in this section walk through the five surfaces most families ride — pavement, parks, grass, gravel, and indoors — and what each one demands of the bike.",
      "Two specs dominate every terrain conversation: weight, which decides how easily a child can lift, carry, and re-start the bike, and tire type, which trades grip and comfort for maintenance-free convenience.",
      "Match the guide to your regular route rather than the best-case one. A family with a smooth sidewalk and a park down the street has a different shortlist than a family whose main surface is a lawn.",
    ],
    faqs: [
      {
        q: "Can a balance bike go on grass?",
        a: "Yes, but grass raises rolling resistance enough that frame weight becomes the limiting factor. Keep sessions short on turf and bias toward the lighter end of the bike's weight class.",
      },
      {
        q: "Do I need special tires for gravel?",
        a: "For occasional gravel, wider pneumatic tires help more than any frame upgrade. For regular gravel riding, a dedicated kids' bike with knobby tires is the better tool — balance bikes are optimized for smooth and packed surfaces.",
      },
    ],
    keywords: {
      en: ["where to ride balance bike", "balance bike terrain", "balance bike for grass", "balance bike tires"],
      zh: ["平衡车在哪里骑", "平衡车地形", "平衡车轮胎"],
    },
  },
  budget: {
    h1: "Budget Guides: What Each Tier Buys",
    fullTitle: "Balance Bike on a Budget: Guides & Tiers | BalanceBikeToddler",
    description:
      "Budget balance bike guides: what each price tier buys, the trade-offs in frame, tires and weight, and the checks that separate a keeper from a dud.",
    introHeading: "What does each price tier actually buy?",
    introParagraphs: [
      "A balance bike's price buys three things — frame material, wheel type, and adjustment range — and almost nothing else. The guides in this section break down what each tier delivers using manufacturer-published specifications, so a $30 bike and a $150 bike can be compared on the same sheet.",
      "Fit is the one variable price cannot fix. Every guide here starts from the inseam-to-seat measurement, because a cheaper bike that fits will teach balance better than a premium bike that is too tall.",
      "The trade-offs are stated plainly: what a budget frame saves in cost it charges back in weight, what foam wheels save in maintenance they charge back in grip, and what a short seat range saves in simplicity it charges back in useful life.",
    ],
    faqs: [
      {
        q: "Is a cheap balance bike good enough?",
        a: "For a first bike, often yes — if the seat height fits today and the frame is light enough for the child to lift. Price mostly buys adjustment range and frame material, not safety: CPSIA limits and tracking labels apply at every price point.",
      },
      {
        q: "What is the sweet spot for a first balance bike?",
        a: "The tier where the seat range covers at least a year of growth and the published weight stays manageable for your child. For most families that is the mid band, but the budget band is a legitimate starting point.",
      },
    ],
    keywords: {
      en: ["budget balance bike", "cheap balance bike", "balance bike price", "balance bike under $100"],
      zh: ["预算平衡车", "便宜平衡车", "平衡车价格"],
    },
  },
  risk: {
    h1: "Safety Risks & Pre-Ride Checks",
    fullTitle: "Balance Bike Safety Risks & Pre-Ride Checks | BalanceBikeToddler",
    description:
      "Balance bike safety guides: the pre-ride checks that matter, the standards behind them, and how to check recalls before you buy.",
    introHeading: "What should you check before the first ride?",
    introParagraphs: [
      "Balance bikes are low-speed, feet-first machines, and the real risks are mundane: a seat set too high, a loose clamp, an exposed handlebar end. The guides in this section cover the checks that catch those problems, in the order that matters, with the safety standard behind each one.",
      "Each check is tied to a published requirement — 16 CFR 1512 and CPSIA in the US, the EN 71 series in the EU — so a bike can be verified against the rule rather than a marketing claim.",
      "The highest-value step in this whole section takes two minutes: checking the model against the CPSC and EU Safety Gate recall databases before the first ride, new or used.",
    ],
    faqs: [
      {
        q: "How often should I re-check the bolts?",
        a: "Every few weeks during the first month, then monthly. Vibration finds loose fasteners, and a slipping seat post or loose stem is the most common mechanical failure on kids' bikes.",
      },
      {
        q: "When does a child need a helmet on a balance bike?",
        a: "Whenever they are riding. The helmet should sit level, with the strap snug enough to stay put when the child shakes their head, and be replaced after any crash involving an impact.",
      },
    ],
    keywords: {
      en: ["balance bike safety", "balance bike checklist", "balance bike helmet", "balance bike recalls"],
      zh: ["平衡车安全", "平衡车检查清单", "平衡车头盔"],
    },
  },
  maintenance: {
    h1: "Maintenance: What Actually Matters",
    fullTitle: "Balance Bike Maintenance & Upkeep Guides | BalanceBikeToddler",
    description:
      "Balance bike maintenance guides: what actually needs attention, what you can ignore, and how frame material changes the upkeep.",
    introHeading: "What does a balance bike actually need?",
    introParagraphs: [
      "A balance bike has fewer moving parts than almost anything else on wheels, and the honest maintenance list is short: bolts, tire pressure if pneumatic, and a wipe-down after wet rides. The guides in this section cover that list and, just as usefully, the long list of things you can skip.",
      "Frame material is the variable that changes the workload. Steel needs paint touch-ups and dry storage; aluminum and composite frames do not rust; every material still needs the same bolt checks.",
      "Retirement criteria are covered too — what counts as a crack, when foam wheels are worn out, and why a cracked kids' frame is a replacement rather than a repair.",
    ],
    faqs: [
      {
        q: "Do foam wheels need any maintenance?",
        a: "No — nothing to inflate, nothing to puncture, nothing to check. The trade-off is grip and comfort on wet or rough surfaces, not upkeep.",
      },
      {
        q: "When should a balance bike be retired?",
        a: "Retire the frame at any crack, bend, or deep rust at a joint; retire foam wheels when worn flat or cracked, and pneumatic wheels when the sidewalls are cut or the tread is gone. Seats and grips are replaceable wear items.",
      },
    ],
    keywords: {
      en: ["balance bike maintenance", "balance bike tires foam air", "balance bike bolts"],
      zh: ["平衡车保养", "平衡车轮胎", "平衡车螺栓"],
    },
  },
  special: {
    h1: "Fit for Riders Who Need Support",
    fullTitle: "Balance Bike Fit for Extra Support Needs | BalanceBikeToddler",
    description:
      "Balance bike fit guides for children who need extra support: inseam-first sizing, step-through frames, and the adjustments that matter most.",
    introHeading: "What fit decisions matter when support is the priority?",
    introParagraphs: [
      "When a rider needs more support — because they are smaller, more cautious, or building confidence at their own pace — sizing moves from important to everything. The guides in this section cover the physical fit decisions: inseam-first seat height, step-through frame geometry, and the adjustments that matter more than the model badge.",
      "Two numbers carry most of the decision: the lowest seat position against the child's inseam, and the frame weight relative to the rider. A bike the child cannot lift is a bike they cannot recover from.",
      "These guides cover physical fit and setup only. They make no claims about any medical or developmental condition — for that, involve the professional who works with your child, and use these pages to find a bike that meets the constraints they identify.",
    ],
    faqs: [
      {
        q: "What frame geometry helps a rider who needs support?",
        a: "A low step-through top tube: it lets the child mount and dismount by stepping through rather than swinging a leg over, and it lowers the center of gravity so the bike feels more stable at rest.",
      },
      {
        q: "How should the seat be set?",
        a: "At or just below the child's inseam, so both feet rest flat with a slight knee bend when seated. A longer seat range (roughly 11–17 inches) keeps the fit correct as the child grows.",
      },
    ],
    keywords: {
      en: ["balance bike special needs", "adaptive balance bike", "balance bike inseam fit"],
      zh: ["特殊需求平衡车", "平衡车适配", "平衡车腿长"],
    },
  },
};

/** Explored-from links per topic (relative hrefs). */
export const GUIDES_TOPIC_EXPLORE_LINKS: Record<GuidesTopicPageId, Array<{ href: string; label: string }>> = {
  beginner: [
    { href: "/guides", label: "All guides" },
    { href: "/reviews", label: "Review center" },
    { href: "/products/balance-bikes/", label: "Balance bikes hub" },
    { href: "/products/strollers/", label: "Strollers hub" },
  ],
  scenario: [
    { href: "/guides", label: "All guides" },
    { href: "/balance-bike-stability/", label: "Stable-track guide" },
    { href: "/balance-bike-weight/", label: "Weight & materials" },
    { href: "/products/balance-bikes/", label: "Balance bikes hub" },
  ],
  budget: [
    { href: "/guides", label: "All guides" },
    { href: "/balance-bike-budget/", label: "Budget balance bike reference" },
    { href: "/balance-bike-size-chart/", label: "Size chart" },
    { href: "/products/balance-bikes/", label: "Balance bikes hub" },
  ],
  risk: [
    { href: "/guides", label: "All guides" },
    { href: "/balance-bike-safety-standards/", label: "Safety standards" },
    { href: "/safety/balance-bike-recalls/", label: "Recall record" },
    { href: "/balance-bike-by-age/", label: "Balance bike by age" },
  ],
  maintenance: [
    { href: "/guides", label: "All guides" },
    { href: "/balance-bike-weight/", label: "Weight & materials" },
    { href: "/guides/risk/balance-bike-safety-checks/", label: "Pre-ride checks" },
    { href: "/products/balance-bikes/", label: "Balance bikes hub" },
  ],
  special: [
    { href: "/guides", label: "All guides" },
    { href: "/balance-bike-size-chart/", label: "Size chart" },
    { href: "/balance-bike-by-age/", label: "Balance bike by age" },
    { href: "/balance-bike-weight/", label: "Weight & materials" },
  ],
};

export const GUIDES_TOPIC_PAGE_IDS = Object.keys(GUIDES_TOPIC_PAGES) as GuidesTopicPageId[];

/**
 * The topic page currently being viewed, or null.
 *
 * /guides/<topic> is prerendered as a full page: its own h1, an intro heading,
 * the cards, FAQs and explore links. The SPA cannot tell that route apart from
 * "a category filter is selected" (both are activeCategory != "all" with no
 * article open), so anything it renders unconditionally is stacked on top of
 * the static page. Two things were re-added on every hydration:
 *
 *   - the wizard section's generic <h1> ("Smart Wizard: How to Choose…") —
 *     a second h1, and the wrong one;
 *   - the guides-hub explainer ("What each guide type covers").
 *
 * Both call sites resolve the topic through this one function, so a new
 * suppression rule is added once.
 *
 * Note the direction: the prerendered <h1> lives inside #root and the app
 * mounts with createRoot().render(), so React throws it away. The SPA has to
 * re-render the topic's own h1 — it cannot simply suppress the wizard's.
 */
export function resolveGuidesTopicPage(activeCategory: string | undefined, activeArticleId: string | undefined): GuidesTopicPage | null {
  if (activeArticleId) return null;
  const key = String(activeCategory || "all") as GuidesTopicPageId;
  return GUIDES_TOPIC_PAGES[key] ?? null;
}

/**
 * Heading the wizard section renders on /guides (no topic, no article open).
 *
 * The prerendered /guides page used to print a different <h1> of its own
 * ("What does the guide library cover?"). Since the prerendered heading lives
 * inside #root and React replaces it at hydration, the non-JS view and the
 * hydrated view disagreed. The SPA is what readers and Google's renderer
 * actually see, so the prerender now mirrors it.
 */
export const GUIDES_WIZARD_H1: Record<"en" | "zh", string> = {
  en: "Smart Wizard: How to Choose a Baby Stroller, Scooter & First Bike",
  zh: "全品类工效学智能选车计算器",
};
