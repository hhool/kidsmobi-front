/**
 * The meta description an article detail page publishes.
 *
 * The CMS authors one teaser per language. In English that teaser is two or
 * three sentences of 100-160 characters — the shape a search snippet wants.
 * The Chinese teasers are one compressed clause of 35-67 characters, below the
 * 70-character floor a snippet needs, and the only honest way to reach it is
 * not padding the tag with filler the page never says.
 *
 * So when the authored teaser is too short, the description becomes the
 * article's OWN opening: the teaser, then the first sentences of the body in
 * the same language, cut at a sentence boundary. Every character is copy the
 * author already wrote, and the length lands where a search engine can use it.
 *
 * Both renderers call this. scripts/prerender-pages.ts writes the result into
 * the static HTML; src/components/GuidesSection.tsx and NewsSection.tsx hand
 * the same value to the hydrated SPA. They used to answer "what is this page
 * about" with different lengths for the same URL — the SPA cut at 155
 * characters, the prerender at 158 — and the Chinese pages answered with a
 * teaser too short to show at all.
 */
import { buildMetaDescription, DESCRIPTION_MAX_CHARS } from "./documentTitle";
import { sanitizeUnsupportedClaims } from "./unsupportedClaims";
import { sanitizeGuideTextForZh } from "./guideTextSanitize";

/**
 * A snippet needs at least this many characters to say anything: under it, a
 * search result truncates the description into a fragment.
 */
export const META_DESCRIPTION_MIN = 70;

/** Which collection a record belongs to. Guides and news normalize their
 *  Chinese copy differently in the SPA (only the guide cards run the Chinese
 *  sanitizer), so the description has to normalize the same way or the static
 *  HTML and the hydrated page would quote different sentences. */
export type ArticleKind = "guide" | "news";

export interface ArticleDescriptionInput {
  /** The language's authored teaser (CMS summary, else the SEO description). */
  summary: string;
  /** The article body in the SAME language. */
  content: string;
  lang: "en" | "zh";
  kind: ArticleKind;
}

/** Collapses every run of whitespace into a single space. */
function normalizeSpace(text: string): string {
  return String(text || "").replace(/\s+/g, " ").trim();
}

/**
 * The body's prose, without the markup that is not prose.
 *
 * Headings are dropped rather than kept: a heading inside a search snippet
 * ("三轮：稳、直觉") reads as a fragment of a list, and the sentence after it
 * carries the meaning on its own. List markers and emphasis are stripped; the
 * text they wrap stays.
 */
function flattenArticleProse(content: string): string {
  return String(content || "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}[^\n]*$/gm, " ")
    .replace(/^\s*[-*+]\s+/gm, " ")
    .replace(/^\s*\d+[.)]\s+/gm, " ")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Splits prose into sentences.
 *
 * Chinese ends a sentence on 。！？；; English on . ! ?. An English period only
 * ends a sentence when whitespace follows it, so "the U.S. market" stays one
 * sentence instead of two.
 */
function splitSentences(text: string, lang: "en" | "zh"): string[] {
  const out: string[] = [];
  let buffer = "";
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    buffer += char;
    const isEnd = lang === "zh" ? "。！？；".includes(char) : ".!?".includes(char);
    if (!isEnd) continue;
    if (lang === "en" && char === ".") {
      const next = text[i + 1];
      if (next && !/\s/.test(next)) continue;
    }
    const sentence = buffer.trim();
    if (sentence) out.push(sentence);
    buffer = "";
  }
  const tail = buffer.trim();
  if (tail) out.push(tail);
  return out;
}

/** Joins two pieces of a description, inserting a space only where the
 *  language uses one. */
function joinParts(left: string, right: string, lang: "en" | "zh"): string {
  if (!left) return right;
  if (!right) return left;
  if (lang === "zh") return `${left}${right}`;
  const needsSpace = !/[\s.!?;:]$/.test(left) && !/^[("'“‘]/.test(right);
  return needsSpace ? `${left} ${right}` : `${left}${right}`;
}

/**
 * Cuts a sentence that does not fit into the budget, at the last soft boundary
 * inside it, so the description does not stop mid-clause.
 */
function cutAtSoftBoundary(sentence: string, room: number): string {
  if (room <= 0) return "";
  const slice = sentence.slice(0, room);
  let best = -1;
  const soft = /[，,、；;：:]/g;
  let match: RegExpExecArray | null;
  while ((match = soft.exec(slice)) !== null) best = match.index;
  const cut = best >= Math.floor(room * 0.5) ? slice.slice(0, best) : slice;
  return cut.replace(/[\s,;:.–—-]+$/, "").trim();
}

/**
 * The final tag value: the same scrub and cap every other description on the
 * site goes through, so a composed description cannot smuggle in a claim the
 * rest of the page scrubbed away.
 */
function finalize(text: string): string {
  return buildMetaDescription(text, sanitizeUnsupportedClaims);
}

/**
 * The <meta name="description"> an article page publishes.
 *
 * An authored teaser that already sits inside the band is used unchanged: it
 * is the copy the editor chose for the snippet. A teaser that is too short is
 * extended with the article's own opening sentences; a teaser that is too long
 * is capped where the shared builder caps every description on the site.
 */
export function buildArticleMetaDescription(input: ArticleDescriptionInput): string {
  const { lang, kind } = input;
  // The Chinese guide cards run the sanitizer in the SPA, so the description
  // runs it too: the sanitizer is idempotent, so the prerender (which starts
  // from the raw CMS copy) and the SPA (which starts from the sanitized copy)
  // quote the same sentences. News cards are not sanitized, so news is not
  // sanitized here either.
  const normalizeZh = lang === "zh" && kind === "guide";
  const summary = normalizeZh
    ? sanitizeGuideTextForZh(input.summary, "") || String(input.summary || "")
    : String(input.summary || "");
  const content = normalizeZh
    ? sanitizeGuideTextForZh(input.content, "") || String(input.content || "")
    : String(input.content || "");

  const teaser = normalizeSpace(summary);
  if (teaser.length > DESCRIPTION_MAX_CHARS) return finalize(teaser);
  if (teaser.length >= META_DESCRIPTION_MIN) return finalize(teaser);

  let composed = teaser;
  for (const sentence of splitSentences(flattenArticleProse(content), lang)) {
    const candidate = joinParts(composed, sentence, lang);
    if (candidate.length > DESCRIPTION_MAX_CHARS) {
      // This sentence does not fit. Cut it at a soft boundary, but only if
      // what is left still clears the floor — otherwise stop here and let the
      // caller publish the short teaser rather than a broken sentence.
      const room = DESCRIPTION_MAX_CHARS - composed.length;
      if (room > 0) {
        const trimmed = cutAtSoftBoundary(sentence, room);
        const candidate2 = joinParts(composed, trimmed, lang);
        if (trimmed && candidate2.length >= META_DESCRIPTION_MIN) return finalize(candidate2);
      }
      break;
    }
    composed = candidate;
    if (composed.length >= META_DESCRIPTION_MIN) break;
  }
  return finalize(composed);
}
