/**
 * Stage-0 honesty guard (see plan-B-execution.md).
 *
 * CMS records still carry legacy copy ("lab-tested", "our lab", "we have
 * tested") describing measurement work this project never performed.
 *
 * This lives in src/ (not inside the prerender script) because both renderers
 * emit these strings: scripts/prerender-pages.ts scrubs the whole document,
 * and src/App.tsx must scrub the meta description it writes at runtime.
 * Keeping one copy is the difference between "the site stopped claiming it"
 * and "the crawler's copy stopped claiming it".
 */
const UNSUPPORTED_CLAIM_REWRITES: Array<[RegExp, string]> = [
  [/lab[\s-]?tested/gi, "evidence-based"],
  [/lab[\s-]?reviewed/gi, "source-reviewed"],
  [/lab[\s-]?verified/gi, "source-reviewed"],
  [/lab[\s-]?matrix/gi, "standards matrix"],
  [/lab[\s-]?measurements?/gi, "published specifications"],
  [/expert lab database/gi, "specification database"],
  [/lab database/gi, "specification database"],
  [/lab scores/gi, "source-based scores"],
  [/from our lab/gi, "from this category"],
  [/we have tested/gi, "we cover"],
  [/we test them/gi, "we compare them"],
  [/independent physical testing lab/gi, "independent analysis"],
  [/our lab checklist/gi, "our source checklist"],
  [/specs our lab extracts/gi, "specs we extract"],
  [/lab[\s-]?style/gi, "source-based"],
  // Hyphenated forms: `/transparency/certification-lab-notes/` must stay a
  // working URL, so nothing that sits directly after a hyphen is rewritten
  // (see the `(?<!-)` guard in sanitizeUnsupportedClaims).
  [/lab[- ]notes?\b(?!\/)/gi, "source notes"],
  [/lab[- ]best[- ]case/gi, "best-case"],
  [/lab score/gi, "source-based score"],
  [/full lab review/gi, "full source-based review"],
  [/lab reviews/gi, "source-based reviews"],
  // Fallback for any remaining adjective use of the word. The lookahead keeps
  // the legacy /transparency/certification-lab-notes/ route readable, and the
  // "lab coat" phrase is figurative, not a measurement claim.
  [/\blab\b(?![-/])(?! coat)/gi, "source-based"],
];

export function sanitizeUnsupportedClaims(html: string): string {
  const restoreCase = (replacement: string, matched: string): string => {
    if (matched.length > 2 && matched === matched.toUpperCase()) return replacement.toUpperCase();
    if (/^[A-Z]/.test(matched)) return replacement.charAt(0).toUpperCase() + replacement.slice(1);
    return replacement;
  };
  // `(?<!-)` keeps every rule away from hyphenated URL slugs such as
  // /transparency/certification-lab-notes/, which must stay clickable.
  return UNSUPPORTED_CLAIM_REWRITES.reduce((acc, [pattern, replacement]) => {
    const urlSafe = new RegExp(`(?<!-)${pattern.source}`, pattern.flags);
    return acc.replace(urlSafe, (match) => restoreCase(replacement, match));
  }, html);
}
