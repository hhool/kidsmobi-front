/**
 * Editorial <title> overrides the repository owns.
 *
 * The CMS is the editorial source for guide and news titles, but a title
 * that is not unique across the site cannot be repaired downstream: two URLs
 * answering one query with one <title> is the cannibalisation pattern Google
 * settles by ranking neither, and the G4 hard list asks for one unique title
 * per page (repos/wb-seo-teardown/references/technical-baseline-34.md,
 * row 1).
 *
 * The CMS write path needs an admin token the build environment does not
 * carry, so the correction lives here — in the repo, next to the code that
 * publishes it — and both renderers read it:
 *
 *   - scripts/prerender-pages.ts  (the static HTML Google fetches)
 *   - src/components/GuidesSection.tsx (the hydrated tab title)
 *
 * The value is the COMPLETE <title> (brand suffix included), because the
 * prerender injects it as page.fullTitle, which buildDocumentTitle returns
 * untouched. The visible <h1> is NOT overridden: the page keeps the headline
 * the CMS authored, and only the tab/search title changes.
 */
/** CMS record id -> the complete <title> per language. */
export const CMS_SEO_TITLE_OVERRIDES: Record<string, { en?: string; zh?: string }> = {
  /**
   * "Balance Bike vs Training Wheels" (the /guides/special/ guide) and
   * "Balance Bike vs Training Wheels: What Wins" (the /guides/beginner/
   * guide) are two different articles about the same decision — one is about
   * what each method teaches a child, the other is a first-purchase
   * comparison — but at a 60-character budget the beginner title caps down
   * to the special one's exact words, and the site would ship two URLs with
   * one title. The special guide gets the word order its own article uses
   * ("training wheels or balance bike" is one of its own keywords) so the
   * two read as different questions.
   */
  "guide-2026-bike-balance-vs-training": {
    en: "Training Wheels or Balance Bike | BalanceBikeToddler",
  },

  /**
   * The CMS title reads "Best Jogging stroller review with Jeep Alterrain".
   * "Alterrain" is a mangling of the product line's own name — the product
   * this review covers is the Jeep Cross-Country Sport Plus Jogger — and a
   * typo in the search-result line is a typo on every search for it. The
   * product's own CMS record carries no "All-Terrain" either, so the title
   * keeps the query it was written for and drops the mangled word.
   */
  "ev_1786178498659": {
    en: "Best Jogging Stroller Review: Jeep | BalanceBikeToddler",
  },

  /**
   * The CMS title reads "Chicco Bravo Trio  stroller reviews with
   * comprehensive " — it stops mid-phrase, with a double space and a
   * trailing space. The review covers the whole travel system (stroller plus
   * KeyFit car seat), which is what the Chinese title already says.
   */
  "ev_1786174722075": {
    en: "Chicco Bravo Trio Stroller Reviews | BalanceBikeToddler",
  },
};

/**
 * The override for a CMS record, or undefined when the record has none.
 *
 * The lookup is LANGUAGE-SCOPED on purpose. An earlier version fell back to
 * the English entry when the page's language had no entry of its own, and
 * that put the English title on the Chinese page: the two languages of one
 * URL then shared a <title>, which is the duplicate the override was written
 * to remove — just moved from a pair of English pages to a pair of language
 * variants of the same page.
 *
 * A record that has no override in the page's language keeps the CMS title it
 * would have published anyway, so nothing is lost by not guessing.
 */
export function cmsSeoTitleOverride(
  id: string | undefined | null,
  lang: "en" | "zh",
): string | undefined {
  const entry = CMS_SEO_TITLE_OVERRIDES[String(id || "")];
  if (!entry) return undefined;
  return entry[lang];
}
