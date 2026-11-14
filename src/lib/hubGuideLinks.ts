/**
 * Which buying guides a product hub should link to, and how each one is titled.
 *
 * Shared by the prerender script (scripts/prerender-pages.ts) and the hydrated
 * SPA (src/App.tsx) so the static HTML and the hydrated DOM carry the same
 * link set. A one-sided implementation would make createRoot() hydration wipe
 * the static block — the exact failure the previous ReferenceClusterNav mirror
 * comment describes.
 *
 * WHY THIS IS DATA-DRIVEN
 *
 * The hub "reference pages" block used to read its guide cards from
 * DEFAULT_REFERENCE_CLUSTER. That list holds five guide entries, all of them
 * balance-bike guides, and clusterGroupOfHref() groups cards by href PREFIX —
 * every guide URL starts with "/guides/", so all five fell into the
 * balance-bike bucket. Six of the seven hubs rendered ZERO guide links, and
 * 63 of the 68 published guides could not be reached from any product hub.
 *
 * The CMS guide records carry taxonomy.productCategory, which is the authority
 * on family membership; that mapping is snapshotted into
 * src/data/guideClusterData.generated.ts (npm run data:guides).
 */
import { GUIDE_CLUSTER_DATA } from "../data/guideClusterData.generated";

export interface HubGuideCard {
  /** Route of the guide, e.g. /guides/scenario/stroller-all-terrain */
  href: string;
  /** Chinese route, e.g. /zh/guides/scenario/stroller-all-terrain */
  hrefZh: string;
  titleEn: string;
  titleZh: string;
  /** Short description used as the card blurb (may be empty). */
  descriptionEn: string;
  descriptionZh: string;
  topic: string;
}

/** Topic ids that have a published channel page (a "best" guide has none). */
const KNOWN_TOPIC_IDS: ReadonlySet<string> = new Set<string>(GUIDE_CLUSTER_DATA.knownTopicIds);

/**
 * Section heading per hub, in both languages.
 *
 * Written per family rather than derived from a template so the heading names
 * the actual subject — "Stroller buying guides" reads better than "Guides for
 * strollers", and a Chinese reader gets a Chinese heading on the Chinese page.
 */
export const HUB_GUIDE_HEADINGS: Record<string, { en: string; zh: string }> = {
  "balance-bikes": { en: "Balance bike buying guides", zh: "平衡车选购指南" },
  "kids-bikes": { en: "Kids bike buying guides", zh: "儿童自行车选购指南" },
  "kids-scooters": { en: "Kids scooter buying guides", zh: "儿童滑板车选购指南" },
  "electric-cars": { en: "Electric ride-on buying guides", zh: "电动骑乘车选购指南" },
  strollers: { en: "Stroller buying guides", zh: "婴儿推车选购指南" },
};

/**
 * Route of an English guide, mirroring guideRoutePath() in
 * scripts/prerender-pages.ts. The topic is the CMS topicCategory, and "best"
 * guides have no channel page — they still live at /guides/best/<slug>.
 */
function guideRoute(topic: string, slug: string): string {
  return `/guides/${topic}/${slug}`;
}

function guideRouteZh(topic: string, slug: string): string {
  return `/zh/guides/${topic}/${slug}`;
}

/**
 * The guides a hub links to, in a stable order.
 *
 * Order is by topic first (the channel a reader would browse), then by title.
 * The topic order puts the how-to material before the round-ups so the block
 * reads as a buying path rather than a list of "best of" posts.
 */
export function hubGuideCards(hubSlug: string): HubGuideCard[] {
  const productCategory =
    (GUIDE_CLUSTER_DATA.hubToProductCategory as Record<string, string>)[hubSlug];
  if (!productCategory) return [];

  const guides = (GUIDE_CLUSTER_DATA.byCategory as unknown as Record<string, ReadonlyArray<{
    slug: string;
    topic: string;
    titleEn: string;
    titleZh: string;
    descriptionEn: string;
    descriptionZh: string;
  }>>)[productCategory];
  if (!guides?.length) return [];

  const topicOrder = ["beginner", "scenario", "budget", "best", "special", "risk", "maintenance"];
  const rank = (topic: string) => {
    const index = topicOrder.indexOf(topic);
    return index === -1 ? topicOrder.length : index;
  };

  return [...guides]
    .sort((a, b) => rank(a.topic) - rank(b.topic) || a.titleEn.localeCompare(b.titleEn))
    .map((guide) => ({
      href: guideRoute(guide.topic, guide.slug),
      hrefZh: guideRouteZh(guide.topic, guide.slug),
      titleEn: guide.titleEn,
      titleZh: guide.titleZh,
      descriptionEn: guide.descriptionEn,
      descriptionZh: guide.descriptionZh,
      topic: guide.topic,
    }));
}

/**
 * Whether a guide's topic has a channel page of its own. Used to decide if a
 * guide card may point at that channel — pointing at a topic page that was
 * never rendered is the dead-link pattern the guide breadcrumbs already guard
 * against.
 */
export function guideTopicHasChannel(topic: string): boolean {
  return KNOWN_TOPIC_IDS.has(topic);
}
