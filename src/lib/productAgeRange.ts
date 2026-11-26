/**
 * Product age-range resolver — one implementation for both renderers.
 *
 * Used by BOTH (same pattern as src/lib/productFaq.ts):
 *  - scripts/prerender-pages.ts   (static HTML "Recommended age" row)
 *  - src/components/DetailedProductView.tsx (hydrated SPA spec tables)
 *
 * Why this module exists
 * ---------------------
 * The two sides used to derive the age range independently, and they disagreed
 * on 191 of 196 products. The prerender read the listing's structured fields;
 * the SPA ignored them entirely and scraped numbers out of the English
 * description with an OPTIONAL unit, so "up to 50 lbs" parsed as "50+ years".
 * 16 records shipped a physically impossible age on the page a reader actually
 * sees (the site mounts with createRoot, so the SPA is the visible render).
 * Two copies of one rule always drift; this is now one copy.
 *
 * Source precedence (most specific first)
 * ---------------------------------------
 *  1. Product_Display_Fields.recommendedAge  — the generated display value
 *  2. Category_Attributes.recommendedAge
 *  3. Product_Specifications.Measurements.recommendedAge
 *  4. Product_Specifications own key names   — "Age Range Description",
 *     "Age Range (Description)", "Recommended Age", flattened across sections
 *  5. Manufacturer Minimum/Maximum Age (MONTHS) — converted to a real range
 *  6. The description's own prose, but ONLY with a unit attached
 *
 * Step 5 exists because 90 records printed a bare shelf label ("Toddler",
 * "Kids", "Baby") for the row that answers "what age is this for?". 27 of them
 * carry numeric months on the same record, and the samples agree with their own
 * English descriptions (18-48 months vs "18 months ... 4 years"), so those
 * ranges are read from data rather than inferred from the label.
 *
 * Step 6 exists but almost never fires (2 of 196): structured data covers
 * everything else. It requires an explicit years/months unit so a weight or a
 * height in the prose can never become an age.
 *
 * A vague label with no numbers anywhere is left as-is: "Toddler" is a poor
 * answer but it is the record's answer, and inventing a range would be worse.
 */

export type AgeLang = "zh" | "en";

/** "Toddler", "Kid", "Baby" describe a shelf, not a fit. */
const VAGUE_AGE_VALUES = new Set([
  "toddler", "toddlers", "kid", "kids", "child", "children",
  "baby", "babies", "infant", "infants", "adult", "adults", "unisex-adult",
]);

/** The listing's own names for the age attribute, in priority order. */
const RAW_AGE_KEYS = ["Age Range Description", "Age Range (Description)", "Recommended Age"];

interface AgeProductLike {
  ageRange?: string;
  name?: string;
  description?: string;
  Product_Description?: string;
  product_description?: string;
  productDescription?: string;
  en?: { description?: string };
  Category_Attributes?: Record<string, unknown>;
  Product_Display_Fields?: Record<string, unknown>;
  Product_Specifications?: Record<string, Record<string, unknown>>;
}

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();

/** Every spec value, flattened, section order preserved (first wins). */
function flatSpecValues(product: AgeProductLike): Record<string, string> {
  const specs = product.Product_Specifications || {};
  const out: Record<string, string> = {};
  for (const section of Object.values(specs)) {
    if (!section || typeof section !== "object") continue;
    for (const [key, value] of Object.entries(section)) {
      if (typeof value !== "string") continue;
      const trimmed = value.trim();
      if (trimmed && !out[key]) out[key] = trimmed;
    }
  }
  return out;
}

/** Reads `Product_Display_Fields[key].value` (the generated display shape). */
function displayFieldValue(
  fields: Record<string, unknown> | undefined,
  key: string,
): string {
  const entry = (fields || {})[key];
  if (!entry) return "";
  if (typeof entry === "string") return clean(entry);
  if (typeof entry === "object") return clean((entry as { value?: unknown }).value);
  return "";
}

/** The structured (non-prose) age label, or "" when the record has none. */
function structuredAgeLabel(product: AgeProductLike): string {
  const fromDisplay = displayFieldValue(product.Product_Display_Fields, "recommendedAge");
  if (fromDisplay) return fromDisplay;

  const fromCategory = clean(product.Category_Attributes?.recommendedAge);
  if (fromCategory) return fromCategory;

  const fromMeasurements = clean(
    (product.Product_Specifications?.Measurements || {}).recommendedAge,
  );
  if (fromMeasurements) return fromMeasurements;

  const flat = flatSpecValues(product);
  for (const key of RAW_AGE_KEYS) {
    if (flat[key]) return flat[key];
  }
  return "";
}

/**
 * A month count this large is a data error, not an age ceiling. One listing
 * stores `Manufacturer Maximum Age (MONTHS) = 1200` (100 years) on a kids
 * ride-on, which rendered as "3 years - 100 years". 18 years is far above any
 * real fit constraint on this catalogue, so a value beyond it is dropped rather
 * than clamped — the remaining endpoint is then used on its own.
 */
const MAX_PLAUSIBLE_AGE_MONTHS = 18 * 12;

/**
 * Formats a min/max month pair.
 *
 * Mixed units read best here and match how these listings describe themselves
 * ("18 months - 4 years"), but forcing one unit per span produced "1.5 years -
 * 4 years" on the records whose floor is 18 months. So: months below 2 years,
 * years at or above it. Years are rounded to the nearest half — 40 months is
 * 3.3 years and printing that implies precision the listing never had.
 */
function formatAgeSpan(minMonths: number, maxMonths: number): string {
  return `${formatMonths(minMonths)} - ${formatMonths(maxMonths)}`;
}

/** Formats a month count as months, or as years once it reaches 2 years. */
function formatMonths(months: number): string {
  if (months < 24) return `${Math.round(months)} months`;
  const years = Math.round((months / 12) * 2) / 2;
  return `${Number.isInteger(years) ? years.toFixed(0) : years.toFixed(1)} years`;
}

/**
 * Turns the listing's own min/max age months into an age range.
 * Returns "" when the record carries no numeric months at all.
 */
export function deriveAgeRangeFromMonths(product: AgeProductLike): string {
  const flat = flatSpecValues(product);
  const pick = (key: string): number | null => {
    const raw = flat[key];
    if (!raw) return null;
    const match = /^\s*([\d.]+)/.exec(raw);
    if (!match) return null;
    const value = Number(match[1]);
    if (!Number.isFinite(value) || value <= 0) return null;
    return value <= MAX_PLAUSIBLE_AGE_MONTHS ? value : null;
  };
  const minMonths = pick("Manufacturer Minimum Age (MONTHS)");
  const maxMonths = pick("Manufacturer Maximum Age (MONTHS)");
  if (minMonths === null && maxMonths === null) return "";

  if (minMonths !== null && maxMonths !== null && maxMonths > minMonths) {
    return formatAgeSpan(minMonths, maxMonths);
  }
  if (minMonths !== null) return `${formatMonths(minMonths)}+`;
  return `up to ${formatMonths(maxMonths as number)}`;
}

/**
 * Last-resort prose pass. The unit is MANDATORY — "up to 50 lbs" is a weight
 * and must not become an age. This was the exact bug that produced "50+ years"
 * on 16 strollers when the unit was optional.
 */
function ageFromProse(product: AgeProductLike): string {
  const evidence = [
    product.en?.description,
    product.Product_Description,
    product.product_description,
    product.productDescription,
    product.description,
    product.name,
  ]
    .map(clean)
    .filter(Boolean)
    .join(" ");
  if (!evidence) return "";

  const withUnit = (value: string, unit: string): string =>
    /month/i.test(unit) ? `${value} months` : `${value} years`;

  const range = /ages?\s*(\d+(?:\.\d+)?)\s*(?:-|–|—|to)\s*(\d+(?:\.\d+)?)\s*(years?|yrs?|months?)/i.exec(evidence)
    || /(\d+(?:\.\d+)?)\s*(?:-|–|—|to)\s*(\d+(?:\.\d+)?)\s*(years?|yrs?|months?)\s*(?:old)?/i.exec(evidence);
  if (range) {
    return `${withUnit(range[1], range[3])} - ${withUnit(range[2], range[3])}`;
  }

  const andUp = /(\d+(?:\.\d+)?)\s*\+?\s*(years?|yrs?|months?)\s*(?:and up|or older|\+|old)/i.exec(evidence);
  if (andUp) return `${withUnit(andUp[1], andUp[2])}+`;

  return "";
}

/**
 * True when the string actually answers "what age is this for?".
 *
 * Not every attribute named "Age Range Description" contains an age. One
 * listing stores "twins or different age siblings" there — a use case, not a
 * fit range — and it was printed in the Recommended age row. A value qualifies
 * only if it carries a number, or is made purely of shelf words ("Toddler",
 * "Baby; Toddler; Kid; Big Kid", "Newborn to Toddler"). Anything else is
 * rejected so the row can fall through to the record's own month range.
 */
function looksLikeAge(value: string): boolean {
  const text = clean(value);
  if (!text) return false;
  if (/\d/.test(text)) return true;

  // Strip the connective words these lists use, then require what remains to be
  // shelf vocabulary only.
  const stripped = text.replace(/\b(?:and|or|to)\b/gi, " ").replace(/[,;/·.]/g, " ");
  const tokens = stripped.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  return tokens.every((token) => SHELF_TOKEN.test(token));
}

/** A shelf word, optionally plural/joined ("Big Kid", "unisex-adult"). */
const SHELF_TOKEN = /^(?:newborn|infant|baby|toddler|kid|child|children|youth|adult|big|little|unisex)(?:s|-[a-z]+)?$/i;

/**
 * The age range to display, resolved from structured data first.
 *
 * Candidates are tried in precedence order and the first one that SURVIVES
 * localization wins. That matters for zh: a stored label that cannot be turned
 * into Chinese ("twins or different age siblings") returns "" from the
 * localizer, and the row should then come from the next source down (the
 * record's own months) rather than disappearing.
 *
 * @param product The raw product record (not the translated display copy).
 * @param lang    Display language.
 */
export function resolveProductAgeRange(product: AgeProductLike, lang: AgeLang = "en"): string {
  const label = structuredAgeLabel(product);
  const labelIsConcrete =
    Boolean(label) &&
    !VAGUE_AGE_VALUES.has(label.toLowerCase()) &&
    looksLikeAge(label);

  const candidates: string[] = [];
  // A real range beats a shelf label, and the record's months beat both.
  if (labelIsConcrete) candidates.push(label);
  const derived = deriveAgeRangeFromMonths(product);
  if (derived) candidates.push(derived);
  // Honest fallback: the vague label the listing states, localised.
  if (label && looksLikeAge(label)) candidates.push(label);
  const fromProse = ageFromProse(product);
  if (fromProse) candidates.push(fromProse);
  if (product.ageRange && looksLikeAge(product.ageRange)) candidates.push(clean(product.ageRange));

  for (const candidate of candidates) {
    const localized = localizeAgeRange(candidate, lang);
    if (localized) return localized;
  }
  return "";
}

const ZH_AGE_WORDS: Record<string, string> = {
  toddler: "幼儿",
  toddlers: "幼儿",
  kid: "儿童",
  kids: "儿童",
  child: "儿童",
  children: "儿童",
  baby: "婴儿",
  babies: "婴儿",
  infant: "婴儿",
  infants: "婴儿",
  newborn: "新生儿",
  newborns: "新生儿",
  adult: "成人",
  "unisex-adult": "成人",
  youth: "青少年",
  "big kid": "大童",
  "big kids": "大童",
};

/** Shelf labels a listing may combine into one list ("Infant; Baby; Toddler"). */
const SHELF_WORD_LIST = /\b(newborn|infant|baby|toddler|kid|youth|child|children|kids|adult)\b/gi

/**
 * zh display of a resolved range. The English value is kept verbatim in en
 * mode: it is the listing's own wording and appears in the product FAQ, so
 * reformatting it would create a second, disagreeing copy.
 *
 * The phrase forms come first. Translating only the units left mixed-language
 * strings ("6 个月 and up", "18 个月-4 岁" was fine but "up to 24 months" was
 * not), and a zh page with English connective words in its spec table is a
 * visible quality defect rather than a cosmetic one.
 */
export function localizeAgeRange(value: string, lang: AgeLang): string {
  let text = clean(value);
  if (!text || lang !== "zh") return text;

  const wholeWord = ZH_AGE_WORDS[text.toLowerCase()];
  if (wholeWord) return wholeWord;

  const zhUnit = (unit: string): string => (/month/i.test(unit) ? "个月" : "岁");
  const num = "\\d+(?:\\.\\d+)?";

  // An "Ages"/"Age" prefix is itself the unit declaration: "Ages 1-6" and
  // "age 5+" name years without repeating the word. Strip it and remember it,
  // so a unitless span is only read as years when the listing said "Ages".
  let agePrefixed = false;
  const prefixMatch = /^ages?\s*(.+)$/i.exec(text);
  if (prefixMatch) {
    agePrefixed = true;
    text = prefixMatch[1].trim();
  }

  // A comma-separated shelf list: "Infant, Newborn, Toddler, Kid".
  if (text.includes(",")) {
    const parts = text.split(",").map((part) => part.trim()).filter(Boolean);
    const translated = parts.map((part) => ZH_AGE_WORDS[part.toLowerCase()] || "");
    if (parts.length > 1 && translated.every(Boolean)) return translated.join("/");
  }

  // A shelf list, which these listings separate with "," ";" "." or "/":
  // "Infant, Newborn, Toddler, Kid" / "Baby; Toddler; Kid; Big Kid" /
  // "Infant. Toddler". Every token must be a known shelf word, or the list is
  // editorial prose ("twins or different age siblings") and must not be
  // half-translated.
  const listParts = text.split(/[,;/·]|\.(?=\s|$)/).map((part) => part.trim()).filter(Boolean);
  if (listParts.length > 1) {
    const translated = listParts.map((part) => ZH_AGE_WORDS[part.toLowerCase()] || "");
    if (translated.every(Boolean)) {
      return [...new Set(translated)].join("/");
    }
  }

  // "2 years old+ Kids" — an age floor plus a redundant audience word.
  const agePlusAudience = new RegExp(
    `^(${num})\\s*(months?|years?|yrs?)\\s*(?:old\\s*)?\\+\\s*(?:kids?|children|child|toddlers?|infants?)$`,
    "i",
  ).exec(text);
  if (agePlusAudience) return `${agePlusAudience[1]} ${zhUnit(agePlusAudience[2])}以上`;

  // "Less than 36 months" / "under 3 years"
  const lessThan = new RegExp(`^(?:less than|under|below)\\s*(${num})\\s*(months?|years?)$`, "i").exec(text);
  if (lessThan) return `${lessThan[1]} ${zhUnit(lessThan[2])}以下`;

  // "6 months up to 45 lbs." — the number after "up to" is a WEIGHT, so the age
  // is the floor, not a ceiling. Read as a minimum rather than dropped.
  const ageThenWeight = new RegExp(`^(${num})\\s*(months?|years?)\\s+up to\\s+${num}`, "i").exec(text);
  if (ageThenWeight) return `${ageThenWeight[1]} ${zhUnit(ageThenWeight[2])}以上`;

  // "6 months and up" / "3 years or older" / "2 years old+"
  const andUp = new RegExp(`^(${num})\\s*(months?|years?|yrs?)\\s*(?:old\\s*)?(?:and up|or older|\\+)$`, "i").exec(text);
  if (andUp) return `${andUp[1]} ${zhUnit(andUp[2])}以上`;

  // "5+" / "6+" once the "Age" prefix established the unit.
  if (agePrefixed) {
    const barePlus = new RegExp(`^(${num})\\+?$`).exec(text);
    if (barePlus) return `${barePlus[1]} 岁以上`;
    const bareSpan = new RegExp(`^(${num})\\s*(?:-|–|—|to)\\s*(${num})$`).exec(text);
    if (bareSpan) return `${bareSpan[1]}-${bareSpan[2]} 岁`;
  }

  // "up to 24 months"
  const upTo = new RegExp(`^up to\\s*(${num})\\s*(months?|years?|yrs?)$`, "i").exec(text);
  if (upTo) return `${upTo[1]} ${zhUnit(upTo[2])}以内`;

  // "18 months - 4 years" / "24 Months to 5 Years Old" / "6 to 36 months"
  // A span may state a different unit at each end, which is how most of these
  // listings describe themselves. Reading only the final unit turned
  // "18 months - 4 years" into "18-4 岁" — a range starting at 18 years.
  const span = new RegExp(
    `^(${num})\\s*(months?|years?|yrs?)?\\s*(?:-|–|—|to)\\s*(${num})\\s*(months?|years?|yrs?)\\s*(?:old)?$`,
    "i",
  ).exec(text);
  if (span) {
    const head = span[2] ? `${span[1]} ${zhUnit(span[2])}` : span[1];
    return `${head}-${span[3]} ${zhUnit(span[4])}`;
  }

  // Word-only spans: "Newborn to Toddler", "5 months to 3 years (parent-pushed)"
  const wordSpan = /^(newborn|infant|baby|toddler|kid|child|children|kids)\s*(?:-|–|—|to|and)\s*(newborn|infant|baby|toddler|kid|child|children|kids)$/i.exec(text);
  if (wordSpan) {
    const head = ZH_AGE_WORDS[wordSpan[1].toLowerCase()];
    const tail = ZH_AGE_WORDS[wordSpan[2].toLowerCase()];
    if (head && tail) return `${head}-${tail}`;
  }

  // Numeric span with a prose tail: "6 months to 3 years (parent-pushed)"
  const spanWithTail = new RegExp(
    `^(${num})\\s*(months?|years?|yrs?)?\\s*(?:-|–|—|to)\\s*(${num})\\s*(months?|years?|yrs?)\\b`,
    "i",
  ).exec(text);
  if (spanWithTail) {
    const head = spanWithTail[2]
      ? `${spanWithTail[1]} ${zhUnit(spanWithTail[2])}`
      : spanWithTail[1];
    return `${head}-${spanWithTail[3]} ${zhUnit(spanWithTail[4])}`;
  }

  const unitOnly = text
    .replace(/\bmonths?\b/gi, "个月")
    .replace(/\byears?\b/gi, "岁")
    .replace(/\byrs?\b/gi, "岁")
    .replace(/\band up\b/gi, "以上")
    .replace(/\bor older\b/gi, "以上")
    .replace(/\s*-\s*/g, "-");

  // INVARIANT: a zh page prints no English in its spec table.
  // Some stored labels are editorial prose that cannot be turned into an age
  // ("twins or different age siblings"). Translating them is not possible and
  // printing them verbatim leaks English onto a Chinese page, so the row is
  // dropped instead — an absent row is honest, a half-translated one is not.
  if (/[a-z]/i.test(unitOnly)) return "";

  return unitOnly;
}