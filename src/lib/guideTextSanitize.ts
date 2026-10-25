/**
 * zh guide-text sanitizer — shared by the guides section (SPA) and tests.
 *
 * The sanitizer de-noises imported CMS copy for Chinese pages: it localizes
 * recurring English terms, drops long marketplace marketing fragments, and
 * falls back to a placeholder when a record carries no real Chinese text.
 *
 * The text is the site's markdown subset, so every pass below runs on raw
 * markdown. Markdown link/image/video targets ([text](url), ![alt](url),
 * @[video](url)) are therefore parked before any transformation and restored
 * after: a URL path is structural, but it reads as visible English copy to
 * both the term localizer ("stroller" -> "推车" rewrites the path itself and
 * 404s the link) and the long-fragment stripper ("/guides/budget/
 * balance-bike-price-tiers" is 37 chars of ASCII and gets eaten whole),
 * which leaked literal "[text](/" fragments into every hydrated zh guide
 * body. See scripts/check-guide-sanitize-links.ts for the regression guard.
 */

import { cleanVisibleSourceText } from "./visibleText";

/** Inline markdown media/link targets — the only structural inline syntax. */
const MARKDOWN_TARGET_PATTERN = /(!?\[[^\]\n]*\]\([^)\s]+\)|@\[video[^\]\n]*\]\([^)\s]+\))/g;

/**
 * NUL-delimited parking slot. NUL is neither whitespace (\s), nor a letter,
 * nor a bracket — every pass below leaves the slot intact, and the slot
 * terminates any accidental run of stripper characters.
 */
const PARK_OPEN = "\u0000";
const PARK_CLOSE = "\u0000";

export function containsCjk(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(String(text || ""));
}

function countMatches(text: string, pattern: RegExp): number {
  const matches = String(text || "").match(pattern);
  return matches ? matches.length : 0;
}

export function isEnglishHeavyForZh(text: string): boolean {
  const value = String(text || "");
  if (!value) return false;
  const cjkCount = countMatches(value, /[\u4e00-\u9fff]/g);
  const asciiLetterCount = countMatches(value, /[A-Za-z]/g);
  if (asciiLetterCount >= 24 && cjkCount <= 4) return true;
  if (asciiLetterCount >= 36 && cjkCount <= 8) return true;
  return cjkCount > 0 && asciiLetterCount > cjkCount * 4;
}

export function localizeGuideTermsForZh(value: string): string {
  return String(value || "")
    .replace(/buyer's\s*guide/gi, "选购指南")
    .replace(/guide\s*library/gi, "指南库")
    .replace(/cover\s*image/gi, "封面图")
    .replace(/read\s*guide/gi, "阅读指南")
    .replace(/beginner\s*entry/gi, "新手入门")
    .replace(/budget\s*guide/gi, "预算指南")
    .replace(/scenario\s*guide/gi, "场景指南")
    .replace(/risk\s*id\s*guide/gi, "风险识别指南")
    .replace(/maintenance/gi, "养护")
    .replace(/jogging\s*stroller|jogger\s*stroller/gi, "慢跑推车")
    .replace(/double\s*stroller|twin\s*stroller/gi, "双人推车")
    .replace(/travel\s*stroller/gi, "旅行推车")
    .replace(/stroller/gi, "推车")
    .replace(/balance\s*bike/gi, "平衡车")
    .replace(/kids?\s*bike|bicycle/gi, "儿童自行车")
    .replace(/kids?\s*scooter|scooter/gi, "儿童滑板车")
    .replace(/electric\s*car/gi, "儿童电动车")
    .replace(/[^\S\n]+/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

function parkMarkdownTargets(value: string): { text: string; targets: string[] } {
  const targets: string[] = [];
  const text = value.replace(MARKDOWN_TARGET_PATTERN, (token) => {
    targets.push(token);
    return `${PARK_OPEN}${targets.length - 1}${PARK_CLOSE}`;
  });
  return { text, targets };
}

function restoreMarkdownTargets(value: string, targets: string[]): string {
  return value.replace(/\u0000(\d+)\u0000/g, (slot, index: string) => {
    const token = targets[Number(index)];
    return token === undefined ? slot : token;
  });
}

export function sanitizeGuideTextForZh(value: string, fallback: string): string {
  const raw = String(value || "");
  if (!raw.trim()) return fallback;

  // Park structural markdown targets before every text pass so URLs survive
  // term localizing and the long English-fragment stripper byte-identical.
  const parked = parkMarkdownTargets(raw);

  const cleaned = localizeGuideTermsForZh(cleanVisibleSourceText(parked.text));
  if (!cleaned) return fallback;
  if (!containsCjk(cleaned)) return fallback;

  // Strip long imported/marketing English fragments that often leak from marketplace copy.
  // Keep newlines intact so paragraph structure from the CMS editor survives.
  const compact = cleaned
    .replace(/[A-Za-z][A-Za-z0-9'&/.,;:()\- \t]{30,}/g, " ")
    .replace(/\b(primary visual asset|imported|polyester|oxford cloth|recommended use|spf|quick release wheels)\b/gi, " ")
    .replace(/[^\S\n]+/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!compact) return fallback;
  // English-heaviness is a property of the VISIBLE text: check before the
  // parked URLs return, so a link-heavy paragraph with one long in-site URL
  // is not mistaken for untranslated English copy.
  if (isEnglishHeavyForZh(compact)) return fallback;

  const restored = restoreMarkdownTargets(compact, parked.targets);
  if (!restored) return fallback;
  return restored;
}

export function sanitizeGuideTitleForZh(value: string, fallback: string): string {
  const normalized = sanitizeGuideTextForZh(value, fallback)
    // Strip leading punctuation/digits only. \W in JavaScript means
    // "not [A-Za-z0-9_]", so a CJK title is all \W — the old /^[\d\W_]+/
    // stripped the entire Chinese title and every guide fell back to its
    // category label ("新手入门指南") on the Chinese page.
    .replace(/^[^A-Za-z0-9\u4e00-\u9fff]+/, "")
    .trim();
  if (!normalized) return fallback;
  const cjkCount = countMatches(normalized, /[\u4e00-\u9fff]/g);
  const asciiLetterCount = countMatches(normalized, /[A-Za-z]/g);
  if (asciiLetterCount >= 16 && cjkCount <= 3) return fallback;
  if (isEnglishHeavyForZh(normalized)) return fallback;
  return normalized;
}
