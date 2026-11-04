/**
 * The one place a page's <title> and meta description are built.
 *
 * The site has two renderers for the same URL: scripts/prerender-pages.ts
 * writes the static HTML Google fetches, and src/App.tsx writes the hydrated
 * SPA a visitor's browser shows. They used to compute titles independently,
 * which is how /transparency/* shipped a <title> with no brand suffix in the
 * SPA while the prerendered HTML of the same URL had one — two different
 * answers to "what is this page called", chosen by whoever loaded it.
 *
 * Both sides now call buildDocumentTitle() / buildMetaDescription() from here.
 * scripts/check-spa-titles.ts fails the build if they ever drift again.
 */

export const SITE_TITLE_SUFFIX = " | BalanceBikeToddler";

/**
 * The SERP budget a <title> has to fit in.
 *
 * The G4 hard list (repos/wb-seo-teardown/references/technical-baseline-34.md,
 * row 1) asks for one unique title per page, 25-60 characters. 60 is not a
 * style preference: a search result cuts a title around there, so the 61st
 * character is a character the searcher never sees. The budget covers the
 * WHOLE title, brand suffix included — the suffix is part of the promise the
 * title makes, so it is spent out of the same 60, not added on top.
 */
export const TITLE_MAX_CHARS = 60;
export const DESCRIPTION_MAX_CHARS = 158;

/** Word-boundary truncation for SEO text. */
export function capSeoText(text: string, maxChars: number): string {
  const raw = String(text || "").trim().replace(/\s+/g, " ");
  if (raw.length <= maxChars) return raw;
  const cut = raw.slice(0, maxChars);
  const sp = cut.lastIndexOf(" ");
  return (sp > 20 ? cut.slice(0, sp) : cut).replace(/[\s,;:.–—-]+$/, "");
}

/**
 * Words that must never be the LAST word of a truncated <title>.
 *
 * `capSeoText` alone is fine for meta descriptions but produces junk titles:
 * it cut "Review Count Integrity: The Numbers We Refused to Publish" down to
 * "…The Numbers We", and "Finding the Best Balance Bike for a 1-Year-Old" to
 * "…for a". In a search result those read like a machine stopped mid-sentence —
 * exactly the "auto-generated content" impression the whole site is trying to
 * avoid. Dropping one more word costs almost no keyword coverage, so the list
 * is deliberately narrow: conjunctions, prepositions, articles and the pronouns
 * that only ever appear mid-clause.
 */
const TITLE_DANGLING_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "nor", "as", "at", "by", "for", "from",
  "in", "of", "on", "to", "with", "than", "then", "that", "this", "these",
  "those", "it", "its", "is", "are", "was", "we", "our", "you", "your", "who",
  "how", "what", "when", "where", "why", "vs", "vs.", "&", "&amp;", "|",
]);

/**
 * Words that are a HEAD of a phrase, not its tail.
 *
 * A title cut at one of these reads as a sentence that stopped mid-thought:
 * "Kids Bike Stability: What Listings" (the word "Publish" was next),
 * "Kids Bike Weight: How Much Does" (the word "It" was next). The word alone
 * is a modifier, so keeping it is worse than dropping the whole clause.
 *
 * Stored without punctuation so "Pre-Ride" and "pre-ride" compare equal.
 */
const TITLE_TAIL_FRAGMENTS = new Set([
  "each", "does", "listings", "includes", "weighs", "safety", "gate", "terrain",
  "voltage", "brands", "worldwide", "developments", "trends", "updates", "checks",
  "needs", "support", "upkeep", "tiers", "guides", "scenarios", "seats",
  "dimensions", "folded", "open", "numbers", "publish", "refused", "baseline",
  "own", "prices", "buys", "compared", "choose", "backless", "light", "boys",
  "girls", "parent", "much", "iso", "eu", "preride", "rideon",
]);

/** True when this word cannot end a title on its own. */
function isTailFragment(word: string): boolean {
  const raw = String(word || "").toLowerCase();
  if (TITLE_DANGLING_WORDS.has(raw)) return true;
  const stripped = raw.replace(/[^a-z0-9]/g, "");
  if (!stripped) return false;
  return TITLE_DANGLING_WORDS.has(stripped) || TITLE_TAIL_FRAGMENTS.has(stripped);
}

/** Drop trailing words that cannot end a title, then the trailing punctuation. */
function trimTail(text: string): string {
  const words = text.split(" ");
  while (words.length > 1 && isTailFragment(words[words.length - 1])) words.pop();
  return words.join(" ").replace(/[\s,;:.–—|&+\-]+$/, "").trim();
}

/** Cut at a word boundary; a hard cut only when there is no room for a boundary. */
function cutAtBoundary(raw: string, maxChars: number): string {
  const cut = raw.slice(0, maxChars);
  const sp = cut.lastIndexOf(" ");
  return sp > 20 ? cut.slice(0, sp) : cut;
}

/**
 * A title cut that ends on a bare number is a broken list, not a title:
 * "Balance Bike by Age: Fits a 2, 3, 4" (Year Old was next) or
 * "Kids Bike by Age: Fits a 2, 6 or 12". The number reads as a complete
 * thought when it is not.
 *
 * "24V" is not a bare number — it carries its unit, so "Kids Ride-On
 * Voltage: 6V, 12V, 24V" is a list that may stand.
 */
function endsWithBareNumber(text: string): boolean {
  const words = text.trim().split(" ");
  const last = (words[words.length - 1] || "").replace(/[.,;:!?]+$/, "");
  return /^\d[\d\-–/]*$/.test(last);
}

/**
 * The text that was cut away continues a list the cut left open: the cut
 * landed between "2, 3" and ", 4 Year Old", or between "6" and " or 12 Year
 * Old". A title that shows three of four ages is worse than one that names
 * the page instead, so such a cut is not a usable candidate.
 */
function cutBreaksAList(raw: string, candidate: string): boolean {
  if (!endsWithBareNumber(candidate)) return false;
  const rest = raw.slice(candidate.length).trimStart();
  return /^(,|、|;|or\b|and\b|&|\+|–|—)/i.test(rest);
}

/**
 * Repair a cut that ends on a bare number by dropping that number: "SEREED
 * Baby Balance Bike Review for 1" becomes "SEREED Baby Balance Bike Review".
 */
function repairNumericTail(text: string): string {
  if (!endsWithBareNumber(text)) return text;
  return trimTail(text.replace(/\s+\d[\d\-–/]*$/, ""));
}

/**
 * "<number> Year" is a complete model name ("KRIDDO Toddler Balance Bike 2
 * Year") unless the original continues with "Old" — "What a 1-3 Year Old"
 * is an age phrase cut in half, and the title reads as a broken claim.
 */
function dropBrokenAgeModifier(raw: string, candidate: string): string {
  const words = candidate.trim().split(" ");
  if (words.length < 2) return candidate;
  const last = (words[words.length - 1] || "").toLowerCase().replace(/[^a-z]/g, "");
  const prev = (words[words.length - 2] || "").replace(/[.,;:!?]+$/, "");
  if (!/^(year|years)$/.test(last)) return candidate;
  if (!/^\d[\d\-–/]*$/.test(prev)) return candidate;
  const rest = raw.slice(candidate.length).trimStart().toLowerCase();
  if (!/^olds?\b/.test(rest)) return candidate;
  return trimTail(words.slice(0, -2).join(" "));
}

/**
 * A cut that leaves an opening bracket unclosed hands the reader half a
 * parenthesis: "折叠电动滑板车（Foldable Electric". Cut before the bracket
 * instead — the text before it is a complete title.
 */
function trimUnbalancedBracket(text: string): string {
  let out = text;
  const pairs: Array<[string, string]> = [["(", ")"], ["（", "）"], ["[", "]"], ["{", "}"]];
  for (const [open, close] of pairs) {
    const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const opens = (out.match(new RegExp(escape(open), "g")) || []).length;
    const closes = (out.match(new RegExp(escape(close), "g")) || []).length;
    if (opens > closes) {
      const idx = out.lastIndexOf(open);
      if (idx > 0) out = out.slice(0, idx);
    }
  }
  return out.trim();
}

/**
 * Title-safe capping: word boundary, then no dangling connector word.
 *
 * A blind cut is not enough. "Balance Bike by Age: Fits a 2, 3, 4 Year Old"
 * cut to 39 characters ends on "4", and "Kids Bike Weight: How Much Does It
 * Weigh?" ends on "Does" — both read like a machine gave up mid-sentence.
 *
 * So the cap picks among three candidates and keeps the LONGEST one that is
 * still a complete title:
 *
 *   A. the word-boundary cut, with a dangling tail trimmed off;
 *   B. the head before the last ": " — the qualifier clause dropped whole;
 *   C. the head plus the longest prefix of the clause that still fits.
 *
 * B exists because a clause is a unit: "Budget Balance Bike: Cheap Picks That
 * Last" is better as "Budget Balance Bike: Cheap Picks" (A and C) than as
 * "Budget Balance Bike" (B), but "Balance Bike by Age: Fits a 2, 3, 4 Year
 * Old" is better as "Balance Bike by Age" (B) than as a cut list (A and C
 * are both rejected — they end on a bare number).
 */
export function capSeoTitle(text: string, maxChars: number): string {
  const raw = String(text || "").trim().replace(/\s+/g, " ");
  if (!raw) return "";
  if (raw.length <= maxChars) return raw;

  const candidates: string[] = [];

  // A — the word-boundary cut, dangling tail trimmed, a bare number dropped.
  const cut = cutAtBoundary(raw, maxChars);
  candidates.push(
    repairNumericTail(dropBrokenAgeModifier(raw, trimTail(trimUnbalancedBracket(cut)))),
  );

  const colon = raw.lastIndexOf(": ");
  if (colon > 0) {
    const head = raw.slice(0, colon);
    const clause = raw.slice(colon + 2);
    // B — the clause dropped whole. The head is an authored phrase, so it is
    // never tail-trimmed: "Kids Bike by Age" must not lose "Age".
    candidates.push(head.trim());
    // C — the head plus the longest prefix of the clause that still fits.
    // If that prefix breaks a list, the clause cannot be shown at all: a
    // shorter prefix would only be a more clipped version of the same broken
    // list, so the whole clause goes and B takes its place.
    const words = clause.split(" ");
    for (let k = words.length; k > 0; k -= 1) {
      const candidate = `${head}: ${words.slice(0, k).join(" ")}`;
      if (candidate.length > maxChars) continue;
      const trimmed = repairNumericTail(dropBrokenAgeModifier(raw, trimTail(candidate)));
      if (cutBreaksAList(raw, trimmed)) break;
      candidates.push(trimmed);
      break;
    }
  }

  const usable = candidates
    .map((candidate) => candidate.trim())
    .filter((candidate) => candidate.length > 0 && candidate.length <= maxChars)
    .filter((candidate) => !cutBreaksAList(raw, candidate))
    .filter((candidate) => trimUnbalancedBracket(candidate) === candidate)
    .sort((a, b) => b.length - a.length);

  return usable[0] || trimTail(cut).slice(0, maxChars).trim();
}

/**
 * Amazon ASINs inside meta descriptions ("… (ASIN B07P1YSC18) is an ultra-light
 * umbrella stroller…") come from CMS review copy. The snippet is the first
 * sentence a parent reads, and an opaque marketplace ID there is the clearest
 * tell that the text was harvested. The identifier stays on the page where it
 * actually does something — it identifies the listing in the body copy.
 */
export function stripCatalogueIds(text: string): string {
  return String(text || "")
    .replace(/\(?\b(?:ASIN|amazon)\s*[:#]?\s*B0[0-9A-Z]{8}\b\)?/gi, "")
    .replace(/\(\s*B0[0-9A-Z]{8}\s*\)/gi, "")
    .replace(/\(\s*\)/g, "")
    .replace(/\s+([,.;:)])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * The full <title> tag for a page.
 *
 * `override` is an explicit full title (used when collision handling had to
 * rewrite one); it wins and is returned untouched. Otherwise the brand suffix
 * is appended and the whole thing capped, so the suffix survives truncation —
 * a title that loses its brand is a title nobody can attribute.
 *
 * Idempotent: passing an already-suffixed title does not double it up, because
 * both renderers call this and the SPA can run over a title the prerender
 * already produced. The already-suffixed branch caps the BODY, not the whole
 * string: capping the whole string cut the brand off the end
 * ("Independent Kids Bike & Stroller Reviews | BalanceBikeToddler" became
 * "Independent Kids Bike & Stroller Reviews |"), which is the opposite of what
 * the suffix is for.
 *
 * The suffix is the house style and it is guarded:
 * scripts/check-prerender-titles.mjs fails the build when a non-product page
 * publishes a title without it. An earlier version of this function instead
 * let a long authored title keep its wording and drop the suffix — 58 pages
 * ended up without the brand, and the guard caught it. The clause the cap
 * drops ("Balance Bike by Age" rather than "Balance Bike by Age: Fits a 2, 3,
 * 4 Year Old") is still the page's <h1>, so the cost is one clause in the
 * search-result line, and the price of dropping the brand from 58 pages is
 * higher.
 */
export function buildDocumentTitle(title: string, override?: string | null): string {
  if (override) return override;
  const stem = String(title || "").trim().replace(/\s+/g, " ");
  if (!stem) return stem;
  if (stem.endsWith(SITE_TITLE_SUFFIX)) {
    const body = stem.slice(0, -SITE_TITLE_SUFFIX.length);
    const full = `${body}${SITE_TITLE_SUFFIX}`;
    if (full.length <= TITLE_MAX_CHARS) return full;
    return `${capSeoTitle(body, TITLE_MAX_CHARS - SITE_TITLE_SUFFIX.length)}${SITE_TITLE_SUFFIX}`;
  }
  const full = `${stem}${SITE_TITLE_SUFFIX}`;
  if (full.length <= TITLE_MAX_CHARS) return full;
  return `${capSeoTitle(stem, TITLE_MAX_CHARS - SITE_TITLE_SUFFIX.length)}${SITE_TITLE_SUFFIX}`;
}

/** The meta description for a page: ASINs stripped, then capped. */
export function buildMetaDescription(
  description: string,
  scrub: (text: string) => string = (text) => text,
): string {
  return capMetaDescription(scrub(stripCatalogueIds(description)));
}

/**
 * Attach the brand suffix to a title that is already composed, when it fits.
 *
 * A product page's title is "Brand Model Review" (sometimes plus the
 * variant label that keeps two colourways apart). Appending the brand costs
 * 21 of the 60 characters, so on the longer model names there is no room for
 * both — and a searcher looking for a stroller is looking for the stroller,
 * not for the publisher. The rule is therefore: the brand stays while the
 * whole title fits in the budget, and the model name stays either way.
 *
 * This is the product-page rule, and it is the one place the site lets the
 * brand go: check-prerender-titles.mjs requires the suffix everywhere EXCEPT
 * under products/, because a model name and a publisher name cannot share 60
 * characters and the model name is what the searcher typed.
 */
export function applyBrandSuffix(composed: string): string {
  const text = String(composed || "").trim().replace(/\s+/g, " ");
  if (!text) return "";
  if (text.length + SITE_TITLE_SUFFIX.length <= TITLE_MAX_CHARS) {
    return `${text}${SITE_TITLE_SUFFIX}`;
  }
  if (text.length <= TITLE_MAX_CHARS) return text;
  return capSeoTitle(text, TITLE_MAX_CHARS);
}

/** Cuts meta description to ≤maxChars at a word boundary. */
export function capMetaDescription(text: string, maxChars = DESCRIPTION_MAX_CHARS): string {
  return capSeoText(text, maxChars);
}
