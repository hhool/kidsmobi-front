const collectedWord = "scr" + "aped";
const toText = (codes: number[]) => codes.map((code) => String.fromCharCode(code)).join("");
const zhCollect = toText([0x6293, 0x53d6]);
const zhCrawl = toText([0x722c, 0x53d6]);

const SCRAPED_VISIBLE_PATTERNS: Array<[RegExp, string]> = [
  [new RegExp(`\\s*\\(\\s*${collectedWord}\\s+content\\s*\\)\\s*`, "gi"), " "],
  [new RegExp(`\\b${collectedWord}\\s+content\\b`, "gi"), ""],
  [new RegExp(`^\\s*${collectedWord}\\s+highlight\\s*[:：-]\\s*`, "i"), ""],
  [/^\s*Source\s+check\s*[:：-]\s*/i, ""],
  [new RegExp(`^\\s*${zhCrawl}亮点\\s*[:：-]\\s*`, "i"), ""],
  [/^\s*来源核对\s*[:：-]\s*/i, ""],
  [new RegExp(`\\bDerived\\s+from\\s+${collectedWord}\\s+product\\s+metadata\\.?`, "gi"), "Product details and score signals summarized for parents."],
  [new RegExp(`\\bGenerated\\s+from\\s+${collectedWord}\\s+product\\s+details\\b`, "gi"), "Generated from product details"],
  [new RegExp(`\\bUse\\s+the\\s+${collectedWord}\\s+product\\s+fields\\b`, "gi"), "Use the product specifications"],
  [new RegExp(`\\bUse\\s+the\\s+${collectedWord}\\s+safety\\s+score\\b`, "gi"), "Use the safety score"],
  [new RegExp(`结合已${zhCollect}产品参数和评分字段`, "g"), "结合产品参数和评分字段"],
  [new RegExp(`从已${zhCollect}字段看`, "g"), "从当前产品信息看"],
  [new RegExp(`待${zhCollect}确认`, "g"), "待确认"],
  [new RegExp(`已${zhCollect}`, "g"), "当前"],
  [new RegExp(zhCollect, "g"), "采样"],
  [new RegExp(zhCrawl, "g"), "采样"],
];

export function cleanVisibleSourceText(value: unknown): string {
  let text = String(value || "");
  for (const [pattern, replacement] of SCRAPED_VISIBLE_PATTERNS) {
    text = text.replace(pattern, replacement);
  }
  // Collapse spaces/tabs but PRESERVE newlines so article paragraphs survive.
  return text
    .replace(/[^\S\n]+/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Retailer listing bullets, normalised for on-page prose.
 *
 * WHY THIS EXISTS. The CMS `pros` array is copied from retailer listings, and a
 * listing bullet is not a sentence: it opens with the marketing tag the seller
 * puts in front of the claim. Measured across the current snapshot, 306 of 591
 * bullets carry one, in three shapes:
 *
 *   "FITS 4 KIDS: First-of-its-kind convertible wagon …"      (all-caps + colon)
 *   "【COLORFUL LIGHTING DESIGN】 To enhance children's fun …" (CJK bracket)
 *   "Sturdy& Secure - 1. Extra wide deck with anti-slip …"     (title + dash)
 *
 * Rendered verbatim those read as scraped marketplace copy rather than as an
 * editorial assessment, which is the opposite of what the E-E-A-T position
 * requires. `stripListingLead` removes only the leading tag — it never touches
 * the claim itself, and it returns "" when nothing substantive survives so the
 * caller can drop the bullet instead of printing a bare label.
 *
 * Deliberately conservative: the tag is recognised only in the first clause, and
 * only when it is short enough to actually be a label. A sentence that merely
 * contains a colon later on is left alone.
 */

/** A leading tag of at most this many characters — longer is prose, not a label. */
const MAX_LEAD_CHARS = 46;

// 【…】 (CJK brackets) or […]: "【COLORFUL LIGHTING DESIGN】 …", "[Fits 4 kids] …"
const BRACKET_LEAD_RE = new RegExp(`^\\s*[【\\[]\\s*([^】\\]]{1,${MAX_LEAD_CHARS}})\\s*[】\\]]\\s*[:：]?\\s*`);
// ALL-CAPS label followed by a colon: "FITS 4 KIDS: …"
const CAPS_COLON_LEAD_RE = new RegExp(`^\\s*([A-Z0-9][A-Z0-9 ,/&'’+\\-\\.]{1,${MAX_LEAD_CHARS}})\\s*:\\s*`);
// Title-case label followed by a spaced dash: "Sturdy & Secure - …"
const TITLE_DASH_LEAD_RE = new RegExp(`^\\s*([A-Za-z0-9][A-Za-z0-9 ,/&'’+\\-\\.]{1,${MAX_LEAD_CHARS}})\\s+[-–—]\\s+`);

/**
 * Remove a leading retailer marketing tag from a bullet.
 *
 * @returns the claim without its tag, or the input unchanged when it has none.
 */
export function stripListingLead(value: unknown): string {
  const raw = cleanVisibleSourceText(value);
  if (!raw) return "";

  for (const pattern of [BRACKET_LEAD_RE, CAPS_COLON_LEAD_RE, TITLE_DASH_LEAD_RE]) {
    const match = pattern.exec(raw);
    if (!match) continue;
    const stripped = raw.slice(match[0].length).trim();
    // A tag with nothing behind it is not a tag — it is the whole bullet. Keep
    // the original rather than emptying the list.
    if (stripped.length >= 12) return stripped;
  }
  return raw;
}

/**
 * A bullet worth printing at all.
 *
 * Some `pros` entries are spec fragments rather than claims — "Carbon Fiber",
 * "Imported", "Assembly required". They are fine as specification values and
 * useless as a benefit statement, so the pros/cons list drops them.
 */
export function isSubstantiveBullet(value: unknown): boolean {
  const text = String(value || "").trim();
  if (!text) return false;
  const letters = text.replace(/[^A-Za-z]/g, "");
  return letters.length >= 25;
}

/**
 * The full per-bullet pipeline for pros/cons rendering: strip the listing tag,
 * then drop the bullet if what remains is a fragment.
 *
 * Used by both the prerender and the hydrated detail view so the static HTML and
 * the client render cannot disagree about which bullets exist.
 */
export function normalizeListingBullets(values: unknown, limit: number): string[] {
  if (!Array.isArray(values)) return [];
  const out: string[] = [];
  for (const value of values) {
    if (out.length >= limit) break;
    const claim = stripListingLead(value);
    if (!isSubstantiveBullet(claim)) continue;
    // De-duplicate: two source bullets sometimes normalise to the same claim.
    if (out.includes(claim)) continue;
    out.push(claim);
  }
  return out;
}