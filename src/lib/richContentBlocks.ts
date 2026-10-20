/**
 * Shared line classifier for the site's markdown subset.
 *
 * The same article body is rendered twice: `scripts/prerender-pages.ts` emits
 * HTML strings for the static build, and `src/lib/richContent.tsx` emits React
 * nodes for the hydrated app. Two independent parsers drifted — the prerender
 * one grew `##` → <h2> and a plain-text section-label promotion ("I. Foo" →
 * <h2>, "1. Foo" → <h3>) while the app one never did, so every published guide
 * hydrated into literal "## " paragraphs with zero <h2> headings.
 *
 * This module is the single classifier both sides call, so a new syntax level
 * has exactly one place to be added. It is deliberately React-free (the
 * prerender script runs under tsx and must not pull in JSX).
 */

export type RichLineKind = "h2" | "h3" | "h4" | "ul" | "ol" | "p";

export interface RichLine {
  kind: RichLineKind;
  /** Line text with the leading marker already stripped. */
  text: string;
}

/**
 * CMS plain-text sections ("I. Four Key Buying Factors", "1. Multi-Wheel
 * Support & High Stability") otherwise ship as bare paragraphs, leaving the
 * whole article without a single heading. Only lines that look exactly like a
 * label — short, no sentence-ending punctuation — are promoted.
 */
const SECTION_LABEL = /^(?:[IVX]{1,4}|\d{1,2})\.\s+(\S.{2,88}[^\s.,;:])$/;
const HEADING = /^(#{2,4})\s+(.*)$/;
const BULLET = /^[*•-]\s+(.*)$/;
const ORDERED = /^\d+[.、)]\s+(.*)$/;

/**
 * Order matters and is shared: a line can look like both a heading and a list
 * item, and both renderers must resolve the tie the same way.
 */
export function classifyRichLine(rawLine: string): RichLine | null {
  const line = String(rawLine ?? "").trim();
  if (!line) return null;

  const sectionLabel = SECTION_LABEL.exec(line);
  if (sectionLabel) {
    return { kind: /^[IVX]{1,4}\./.test(line) ? "h2" : "h3", text: sectionLabel[1] };
  }
  const heading = HEADING.exec(line);
  if (heading) {
    return { kind: heading[1].length === 2 ? "h2" : heading[1].length === 3 ? "h3" : "h4", text: heading[2] };
  }
  const bullet = BULLET.exec(line);
  if (bullet) return { kind: "ul", text: bullet[1] };
  const ordered = ORDERED.exec(line);
  if (ordered) return { kind: "ol", text: ordered[1] };
  return { kind: "p", text: line };
}
