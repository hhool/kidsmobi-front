/**
 * Publishing guard for marketplace review counts.
 *
 * Some listings in the catalogue arrive with review counts that cannot be
 * true — values around 45–47 million for items like a playard or a double
 * stroller, i.e. more ratings than the product category plausibly sells units.
 * Those numbers reach three places that matter:
 *
 *   1. visible copy ("★ 4.7/5 · 47,475,117 ratings"),
 *   2. Product JSON-LD `aggregateRating.ratingCount` / `reviewCount`,
 *   3. internal ranking maths (see productValueScore in EvaluationsSection),
 *      where reviewCount / 100,000 turns one bad row into a +475 score boost
 *      and silently reorders "top pick" lists.
 *
 * Publishing a number we cannot defend is the same category of problem as the
 * unsupported lab claims removed in ce93535: it reads as fabricated to both
 * readers and reviewers. When a count fails this gate we drop it and keep the
 * star rating, rather than replacing it with a guess.
 *
 * Calibrated against this catalogue, whose highest credible figure is a
 * convertible car seat at ~59k ratings. The threshold sits well above that so
 * legitimate movers are never touched — it only catches values that are off by
 * one to three orders of magnitude.
 */
export const MAX_PLAUSIBLE_REVIEW_COUNT = 200_000;

/**
 * Returns the count only when it is a positive whole number we are willing to
 * publish, otherwise null. Callers must treat null as "do not publish" — for
 * example, skip the whole `aggregateRating` block rather than emit one whose
 * ratingCount we cannot defend.
 */
export function credibleReviewCount(value: unknown): number | null {
  const raw = Number(value);
  if (!Number.isFinite(raw) || raw <= 0) return null;
  const count = Math.trunc(raw);
  if (count > MAX_PLAUSIBLE_REVIEW_COUNT) return null;
  return count;
}
