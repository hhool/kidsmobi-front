/**
 * Shared "related reviews" matcher — the SPA half lives in GuidesSection.tsx
 * and the prerender half in scripts/prerender-pages.ts, and both must rank the
 * same way: a reader who hydrates the page should see the same four links the
 * crawler was served.
 *
 * Two things this module exists to get right:
 *
 * 1. Language. Every evaluation record carries both an English and a Chinese
 *    title (all 31 do), but both call sites used to read `en.title` first, so
 *    Chinese article pages advertised English review titles. The display title
 *    is now chosen by the page's language.
 *
 * 2. Scoring. The old matcher split the *English* review title into word
 *    tokens and looked for them in the guide text. On a Chinese page that can
 *    never work as intended — Chinese has no spaces, so an English token only
 *    "matches" when the translation happens to contain that English word
 *    (brand names, "EN 71", URLs). Chinese titles are therefore matched by
 *    character bigrams, which is the standard word-boundary-free approximation
 *    for CJK.
 */

export type RelatedReviewEntry = {
  /** English title of the evaluation (display on English pages). */
  enTitle: string;
  /** Chinese title of the evaluation (display on Chinese pages). */
  zhTitle: string;
  /** Route of the review page, already derived by the caller. */
  path: string;
};

const STOP = new Set(["review", "reviews", "single", "compare", "with", "the", "and", "for", "best"]);

/** CJK character bigrams — the matching unit for a Chinese body/title pair. */
function bigrams(value: string): string[] {
  const han = String(value || "").replace(/[^\u4e00-\u9fff]/g, "");
  const out: string[] = [];
  for (let i = 0; i + 1 < han.length; i += 1) out.push(han.slice(i, i + 2));
  return out;
}

/** English word tokens of at least 4 characters, minus the generic ones. */
function wordTokens(value: string): string[] {
  return String(value || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4 && !STOP.has(token));
}

/**
 * Rank evaluation entries against a guide's text and return the top few,
 * titled in the page's language.
 *
 * `guideText` decides the matching mode: a Chinese body is bigram-matched
 * against the Chinese titles, an English body token-matched against the
 * English ones. Entries whose title is missing in the needed language fall
 * back to the other one; entries that score zero are dropped rather than
 * padded with unrelated reviews.
 */
export function rankRelatedReviews(
  guideText: string,
  entries: RelatedReviewEntry[],
  lang: "en" | "zh",
  limit = 4,
): Array<{ title: string; path: string }> {
  const text = String(guideText || "");
  if (!text.trim() || !entries.length) return [];
  const chinese = /[\u4e00-\u9fff]/.test(text);
  const units = new Set(chinese ? bigrams(text) : wordTokens(text));
  if (!units.size) return [];

  return entries
    .map((entry) => {
      const title = lang === "zh" ? entry.zhTitle || entry.enTitle : entry.enTitle || entry.zhTitle;
      if (!title || !entry.path) return null;
      const probe = chinese ? bigrams(title) : wordTokens(title);
      const score = probe.filter((unit) => units.has(unit)).length;
      return score > 0 ? { title, path: entry.path, score } : null;
    })
    .filter((entry): entry is { title: string; path: string; score: number } => Boolean(entry))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ title, path }) => ({ title, path }));
}
