/**
 * Keyword-rich URL slug for evaluation (review) detail pages.
 *
 * Must stay in lockstep with the worker's `capSlug` / `deriveContentPath`
 * (backend/api/worker/src/index.ts): the sitemap emits
 * `/reviews/{type}/{evaluationSlug(e)}` and the app must resolve the exact
 * same URLs. Chain: en.title → zh.title → record slug → record title;
 * CJK-only text slugifies to "" so records without any Latin title keep
 * resolving through their raw id (id matching is always supported).
 */

function slugifyText(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function capSlugText(input: string, maxChars = 60): string {
  const raw = String(input || "").trim();
  if (!raw) return "";
  const base = slugifyText(raw);
  if (!base || base === "item") return "";
  if (base.length <= maxChars) return base;
  const cut = base.slice(0, maxChars);
  const lastDash = cut.lastIndexOf("-");
  return lastDash > 20 ? cut.slice(0, lastDash) : cut;
}

export function evaluationSlug(evaluation: unknown): string {
  const e = (evaluation || {}) as Record<string, any>;
  const en = e.en as Record<string, unknown> | undefined;
  const zh = e.zh as Record<string, unknown> | undefined;
  return (
    capSlugText(String(en?.title || "")) ||
    capSlugText(String(zh?.title || "")) ||
    capSlugText(String(e.slug || "")) ||
    capSlugText(String(e.title || "")) ||
    ""
  );
}

/** URL path segment for an evaluation detail route (slug preferred, id fallback). */
export function evaluationRouteSegment(evaluation: unknown): string {
  return evaluationSlug(evaluation) || String((evaluation as any)?.id || "");
}
