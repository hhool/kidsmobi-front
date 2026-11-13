/**
 * Owner-reported drawbacks, derived from the `customersSay` field.
 *
 * WHY THIS EXISTS
 *
 * Every product record ships `en.pros` (196/197) and `en.cons` (0/197). The
 * product detail page therefore rendered a Pros column beside an empty Cons
 * column on every single page — a one-sided recommendation that reads as
 * promotional copy rather than an assessment, which is precisely what an
 * E-E-A-T-led review site must not do.
 *
 * The site has the missing half and was already rendering it: `customersSay`
 * (186/197) is a summary of aggregated owner feedback, and it regularly states
 * what owners did not like. Measured against the current snapshot, 151 of those
 * 186 records contain at least one drawback, in a small number of stable
 * sentence frames:
 *
 *   "The durability receives mixed reviews, with some finding it long-lasting
 *    while others report issues with parts coming loose."
 *   "While some customers find it durable, others report issues with it breaking."
 *   "However, functionality receives mixed reviews, with some reporting the
 *    motor stops working entirely."
 *   "... and one customer notes the front wheels aren't very responsive."
 *
 * The extractor below recovers the drawback clause from those frames.
 *
 * WHY DERIVED AND NOT AUTHORED
 *
 * The alternative — writing 197 cons by hand — would mean inventing criticisms
 * the source data does not support, which is a worse failure than an empty
 * column. Deriving from owner feedback keeps the statement tied to evidence:
 * if a record's `customersSay` says nothing negative, no con is emitted for it,
 * and the column is omitted rather than padded. Each extracted line is
 * attributed ("Owners report …") so the reader knows the source and its weight.
 *
 * CONSERVATISM RULES
 *
 *  - A sentence only counts when the *drawback* is the point of the sentence,
 *    not when a negative word merely appears inside a positive one ("doesn't
 *    tip over easily" is a benefit and is never extracted).
 *  - Only the clause after the contrast marker is taken, cut at the first
 *    coordinator that starts a new clause. The positive half of a
 *    "while some … others …" sentence is left behind on purpose.
 *  - A tail that only *names* a complaint category ("issues with stability",
 *    "others report difficulties") is dropped: the category is not a finding,
 *    and "Owners report difficulties" would tell the reader nothing while
 *    still reading as an assessment.
 *  - POLARITY IS CHECKED, NOT ASSUMED. "It is not too heavy" is a benefit; the
 *    negation cancels the adjective. The negated form is only accepted when it
 *    comes from a topic-noun predicate ("it is not stable"), never inferred
 *    from "not <adjective>".
 *  - Anything shorter than 16 characters is dropped as a fragment, and the
 *    result is capped so one verbose record cannot dominate the column.
 */

/**
 * Contrast markers that introduce the negative half of a mixed-review sentence.
 *
 * ORDER MATTERS — MOST SPECIFIC FIRST. The generic "while others …" pattern
 * below also matches the front half of "While some customers find it durable,
 * others report …", capturing the *positive* clause. Every pattern is anchored
 * or requires the contrast word to be preceded by a clause boundary, and the
 * "While some …, others …" frame is tried before the generic one so the correct
 * half is taken.
 */
const CONTRAST_PATTERNS: RegExp[] = [
  // "While some customers find it durable, others report issues with it breaking."
  // Anchored: only fires when the sentence *opens* with "While some".
  /^While\s+[^,]+,\s*(?:others?|some|many)\s+(?:report|say|find|mention|note|describe|complain)\s+(.+)$/i,
  // "… and one customer notes the front wheels aren't very responsive."
  /(?:^|[.;]\s*|\s+and\s+)one customer (?:notes|says|mentions|reports|complains)\s+(?:that\s+)?(.+)$/i,
  // "… with several mentioning the brakes not working properly."
  /(?:^|[.;]\s*|\s+and\s+)(?:several|a few|multiple) (?:customers?|buyers?|reviewers?)\s+(?:mention|report|say|note|complain)\s+(?:that\s+)?(.+)$/i,
// "… with some finding it sturdy while others describe it as flimsy."
  //
  // This shape has no comma between the positive clause and the contrast:
  // "while others describe" runs straight on. Only "others" qualifies here —
  // "while many find it easy to maneuver, one customer notes …" has "many" in
  // the positive position, and treating it as the contrast pronoun is what made
  // the tail start at "it easy to maneuver". The `[^,;.]*?` span is comma-free
  // so the match cannot reach past the comma into a later clause.
  /\b(?:while|whereas)\s+(?:the\s+)?others\b[^,;.]*?\s+(?:report|say|find|mention|note|describe|complain|claim|state|consider)\s+(?:issues?\s+(?:with|of)|problems?\s+(?:with|of))?\s*(.+)$/i,
];

/**
 * "However, <positive summary> — while some …, others report <drawback>."
 *
 * This frame leads with "However," and then usually contains its own contrast
 * clause, so the generic handler below already finds the drawback. The pattern
 * here covers the remaining shape where there is no inner "while": the drawback
 * follows a reporting verb directly ("However, functionality receives mixed
 * reviews, with some reporting the motor stops working entirely").
 *
 * Greedy on purpose: `[^.]*?` is anchored at the start and takes the LAST
 * reporting verb, so a sentence with several "with some …" clauses yields the
 * final drawback rather than the first.
 */
const HOWEVER_FRAME = /^However,\s*[^.]*(?:with some (?:reporting|finding|saying)|some (?:report|say|find|complain|mention))\s+(.+)$/i;

/**
 * The generic contrast frame, handled separately because it needs LAST-match
 * semantics.
 *
 * The dominant shape is not "while others report" but "while <positive clause>,
 * others report <drawback>": the positive and negative halves are on either
 * side of a comma, and the contrast pronoun that carries the drawback comes
 * after it. So the marker is spelled with the comma inside the span, and the
 * middle may not itself contain a contrast word — that restriction is what
 * stops "while some find it sturdy" (no comma, no "others") from matching.
 *
 * A sentence can contain several such clauses ("… with some finding it sturdy,
 * others report …"), and the drawback is always after the last one, so every
 * marker is collected and only the tail after the final marker is used.
 */
const CONTRAST_MARKER = new RegExp(
  "\\s*(?:,|;|\\s+but\\s+|\\s+and\\s+|\\s*-\\s*|\\s+with\\s+)?\\s*(?:while|whereas)\\s+" +
    // The positive clause: anything up to a comma, never a contrast word.
    "(?:(?!\\b(?:while|whereas|others?)\\b)[^,;.])*,?\\s*" +
    // The contrast pronoun. "others" is the only one that reliably marks the
    // drawback; "some"/"many" also appear in the positive position ("while
    // many find it easy to maneuver"), and accepting them here made the tail
    // start at the benefit. When the sentence uses "some … others …", the
    // comma-separated form below is matched instead.
    "(?:the\\s+)?others\\b[^,;.]*?\\s+" +
    "(?:report|say|find|mention|note|describe|complain|claim|state|consider)\\s+" +
    "(?:issues?\\s+(?:with|of)|problems?\\s+(?:with|of))?\\s*",
  "gi",
);

/**
 * Split a sentence at the LAST contrast marker, returning the drawback text or
 * null when the sentence has no such frame.
 */
function lastContrastTail(sentence: string): string | null {
  const matches = [...sentence.matchAll(CONTRAST_MARKER)];
  if (!matches.length) return null;
  const last = matches[matches.length - 1];
  const tail = sentence.slice((last.index ?? 0) + last[0].length).trim();
  return tail.length >= 16 ? tail : null;
}

/**
 * Cut a compound tail down to the drawback it opens with.
 *
 * A contrast marker ends at the reporting verb ("… others report "), so the tail
 * it leaves behind is the *whole rest of the sentence* — and these sentences
 * chain several drawbacks with "and" ("others say it's not very stable and
 * consider it overpriced"). Emitting the whole tail puts a positive clause back
 * into the Cons column whenever the chain later turns ("… while the canopy is
 * large, the basket underneath isn't very big"), which is exactly the
 * one-sidedness this module exists to remove.
 *
 * So the tail is cut at the first coordinator that starts a *new* clause. The
 * drawback is whatever the marker introduced, and the marker is followed by at
 * most one clause; everything after that coordinator belongs to a different
 * statement, not to this con.
 */
function clipToDrawback(clause: string): string {
  const text = clause
    .trim()
    .split(/\s+(?:and|but|though|although|while|whereas|which)\s+/i)[0]
    .trim();
  return text.replace(/[\s.,;:–—-]+$/, "").trim();
}

/**
 * Phrases that mark a sentence as reporting a drawback, used only to decide
 * *whether* to look for a contrast clause — the clause itself is what gets
 * extracted, so a positive sentence that happens to contain "sturdy" is never
 * treated as a con.
 */
const DRAWBACK_CUE =
  /(mixed (?:reviews|feedback|reactions)|not (?:very|stable|sturdy|easy|responsive|durable|worth|suitable|fitting)|isn't|aren't|don't|doesn't|didn't|disappoint|complaint|issues?\s+(?:with|of)|problems?\s+(?:with|of)|breaking|broke|squeak|noisy|flimsy|cheaply|uncomfortable|confusing|stopped working|not working|poorly|faulty|defect|struggl|hard to (?:assemble|use|fold|push|steer|turn|put together)|difficult|too (?:heavy|small|large|big|light|wide)|wobbl|rattl|coming loose|coming apart|coming undone|falling off|falling apart|snapping|tearing|cracking|stuck)/i;

/**
 * The clause an owner *did not* like, stated as a clause.
 *
 * "others report issues with stability" is a complaint about stability, but the
 * words that survive extraction are "issues with stability" — a topic, not a
 * finding. Rendering that in the Cons column ("Owners report stability") asserts
 * a drawback the sentence does not state. When the tail is only a topic, the
 * marker's reporting verb is kept so the line reads as an attributed report
 * rather than a verdict.
 */
const TOPIC_ONLY_TAIL =
  /^(?:issues?\s+(?:with|of)|problems?\s+(?:with|of)|difficult(?:y|ies)?(?:\s+(?:with|of|in))?|concerns?\s+(?:with|about|over)|complaints?\s+(?:with|about|of)|mixed\s+(?:reviews|feedback|reactions|opinions?))\s*(.*)$/i;

/**
 * A clause that leads with praise. These come from the positive half of a
 * mixed-review sentence, where the contrast marker matched at "while others …"
 * but the tail still opens with the benefit because the sentence had two
 * drawbacks and the marker sat before the wrong one.
 */
const POSITIVE_LEAD =
  /^(?:it'?s?\s+)?(?:super\s+|very\s+|really\s+|extremely\s+|surprisingly\s+)?(?:easy|simple|great|good|excellent|perfect|solid|sturdy|durable|lightweight|affordable|worth|love[ds]?|best|smooth|comfortable|spacious|quiet|fast)\b/i;

/**
 * The tail of a "mixed" clause, which states a *topic* ("The size receives
 * mixed feedback") rather than a drawback. Rendered directly it produces a
 * non-statement ("Owners report the size receives mixed feedback"), so it is
 * rejected: the caller falls through to the next sentence, where the same
 * source usually does state the drawback outright.
 *
 * Matched against the *tidied* clause, which has already rewritten the leading
 * "The size" into "It is" — so both shapes have to be recognised here.
 */
function isMixedTopicTail(text: string): boolean {
  return /^(?:the\s+)?\w[\w\s]{0,40}?\s+(?:receives|gets|is|are)\s+(?:mixed|divided)/i.test(
    text.replace(/^it\s+is\s+/i, "the "),
  );
}

/**
 * True when a clause states something negative about *this* product, as
 * opposed to merely naming a subject that the feedback then called mixed.
 */
function isDrawbackClause(text: string): boolean {
  if (!text) return false;
  if (POSITIVE_LEAD.test(text)) return false;
  if (isMixedTopicTail(text)) return false;
  if (isVagueTopicOnly(text)) return false;
  return DRAWBACK_CUE.test(text) || /\b(?:not|n't|never|no longer|too|weak|poor|bad|broken|breaking|loose|wobbly|flimsy|squeak|stuck)\b/i.test(text);
}

/**
 * A topic-only tail names a complaint category without saying what went wrong
 * ("others report difficulties", "others report issues with stability"). The
 * category is not itself a finding, so the line is dropped rather than dressed
 * up as one — "Owners report difficulties" would tell the reader nothing while
 * still reading as an assessment.
 *
 * A tail that names both a category *and* an object ("issues with the chain
 * falling off") is specific enough to keep: `tidyClause` keeps the object and
 * drops the category wrapper, so only the wrapper-only form is rejected here.
 */
function isVagueTopicOnly(text: string): boolean {
  const body = text
    .replace(/^owners?\s+report\s+/i, "")
    .replace(/^(?:issues?|problems?|difficult(?:y|ies)?|concerns?|complaints?)\b\s*/i, "")
    .replace(/^(?:with|about|of|in|regarding|was|is|are)\b\s*/i, "")
    .trim();
  return body.length < 4;
}

/**
 * A sentence that states a drawback outright, with no contrast marker.
 *
 * Two shapes count. The first leads with a *topic* noun ("The brakes are
 * weak"), so the complaint is unambiguous from the subject alone. The second is
 * a plain predication ("It is too heavy", "It doesn't hold a charge") — no
 * topic noun to anchor on, so the negative predicate is what carries the
 * meaning. Both require the negative term to be a predicate adjective or verb,
 * never a modifier inside a benefit ("doesn't tip over easily").
 */
const DIRECT_DRAWBACK =
  /^(?:the\s+)?(?:assembly|durability|quality|size|weight|brakes?|wheels?|seat|frame|motor|battery|steering|handlebar|strap|harness|canopy|fold|material|fabric|paint|colour|color|design|value|price|performance|functionality|comfort|stability|maneuverability)\b[^.]{0,120}?\b(?:is|are|was|were|feels|seems|gets|receives)\b[^.]{0,40}?\b(?:poor|bad|weak|flimsy|noisy|uncomfortable|difficult|hard|disappointing|cheap|unstable|unresponsive|heavy|small|large|confusing|faulty|defective)\b/i;

/**
 * A plain "it is <negative>" statement with no topic noun.
 *
 * Requires an explicit copula (or a negated auxiliary) so a benefit phrased as
 * "it doesn't tip over easily" is not mistaken for a complaint: the negative
 * word has to be the *predicate*, not a modifier inside a positive one. An
 * optional reporting lead-in is allowed ("Owners say it is too heavy") because
 * these sentences are usually quoted rather than asserted.
 *
 * POLARITY IS PART OF THE PATTERN. "It is not too heavy" is a *benefit* — the
 * negation cancels the adjective — so the negated form is deliberately absent
 * here: a negated complaint has to be spelled out by its own predicate
 * ("it is not stable", handled by the topic-noun rule above), never inferred
 * from "not <adjective>". Without this restriction the module would have put
 * "it is not too heavy" in the Cons column.
 */
const DIRECT_PREDICATION =
  /^(?:(?:owners?|customers?|buyers?|reviewers?|users?|parents?)\s+(?:say|said|report|reported|note|noted|mention|mentioned|find|found|complain|complained)\s+(?:that\s+)?)?(?:it|this|they|the\s+\w+)\s+(?:is|are|was|were|feels|seems|gets|becomes|keeps|stays)\s+(?:really\s+|very\s+|quite\s+|extremely\s+|incredibly\s+|a\s+bit\s+|too\s+)*(heavy|bulky|small|large|big|wide|flimsy|noisy|unstable|uncomfortable|difficult|hard|confusing|poorly|cheap|weak|unresponsive|wobbly|worth|slow|stuck|useless|terrible|awful)\b[^.]*(?:\.[^.]*)*$/i;

/**
 * A plain negative predication with an auxiliary: "it doesn't hold a charge",
 * "the lights don't work at all".
 *
 * The auxiliary is required and the sentence must not contain a positive
 * contrast elsewhere, so "it doesn't tip over easily" (a benefit) stays out.
 */
const DIRECT_AUX_NEGATION =
  /^(?:(?:owners?|customers?|buyers?|reviewers?|users?|parents?)\s+(?:say|said|report|reported|note|noted|mention|mentioned|find|found|complain|complained)\s+(?:that\s+)?)?(?:it|this|they|the\s+\w+)\s+(?:doesn't|don't|won't|can't|isn't|aren't|never)\b[^.]*(?:charge|work|hold|last|stay|fit|turn|steer|fold|retract|lock|attach|remain|hold up|operate|function|rebound|scoot|brake)\b[^.]*(?:\.[^.]*)*$/i;

export interface OwnerDrawback {
  /** The product id this drawback was extracted from. */
  productId: string;
  /** The drawback clause, without the "others report" framing. */
  text: string;
}

/** Split owner feedback into sentences. */
export function ownerSentences(text: unknown): string[] {
  return String(text ?? "")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

/** Tidy an extracted clause: strip trailing punctuation and leading filler. */
function tidyClause(clause: string): string {
  let text = clause
    .trim()
    .replace(/^that\s+/i, "")
    .replace(/^it(?:'s| is)\s+/i, "it ")
    .replace(/[.;,\s]+$/, "")
    .trim();
  if (!text) return "";

  // "issues with stability" is a topic, not a finding: the drawback was never
  // stated, only named. Re-attach the reporting verb so the line reads as an
  // attributed report ("Owners report issues with stability") instead of a bare
  // noun phrase that asserts nothing.
  const topic = TOPIC_ONLY_TAIL.exec(text);
  if (topic) {
    const subject = (topic[1] || text).trim();
    text = `owners report ${subject.charAt(0).toLowerCase()}${subject.slice(1)}`;
  }

  // The source routinely drops the copula after a reporting verb ("others say
  // it very difficult", "others describe it as poorly made"), and normalising
  // "it's" → "it" above reproduces the same shape. Insert the copula once,
  // before any negation, and absorb the "as"/"being" complementiser that
  // English drops before an adjective. Idempotent: "it being" already became
  // "it is", and the guard must not add a second one.
  text = text.replace(/^it\s+(?:as|being)\s+/i, "it is ");
  if (!/^it\s+is\b/i.test(text)) {
    text = text.replace(/^it\s+(not\s+)?/i, "it is $1");
  }
  // A contraction already carries its own auxiliary, so the inserted copula
  // would duplicate it ("It is doesn't keep its charge"). The negation form is
  // matched separately and exactly: the bare `n't` rule below must not fire on
  // the "not" that follows "it is" in "it is not very stable", which is a
  // legitimate copula + negation pair, not a contraction.
  text = text.replace(
    /^it\s+is\s+(doesn'?t|don'?t|isn'?t|wasn'?t|aren'?t|weren'?t|won'?t|can'?t|didn'?t|couldn'?t|shouldn'?t|hasn'?t|haven'?t|hadn'?t)\b/i,
    "it $1",
  );
  text = text.replace(/^it\s+is\s+is\s+/i, "it is ");

  // The source reports faults as bare participles ("others report it coming
  // apart"), and the copula insertion above would turn that into the present
  // continuous ("it is coming apart"), which reads as an action in progress
  // rather than a defect owners found. Keep the participle bare; "it is
  // breaking" would have said the opposite of what the owner reported.
  text = text.replace(/^it\s+is\s+(breaking|coming|falling|tearing|snapping|cracking|ripping|stopping|steering|working)\b/i, "it $1");

  // The source sometimes carries its own reporting lead-in ("Owners say it is
  // too heavy"). Drop it *before* adding the caller's attribution, so the line
  // is not wrapped twice; the lead-in carries no information the Cons column
  // needs, because every line is attributed the same way.
  text = text.replace(
    /^(?:owners?|customers?|buyers?|reviewers?|users?|parents?)\s+(?:say|said|report|reported|note|noted|mention|mentioned|find|found|complain|complained)\s+/i,
    "",
  );

  // A bare noun phrase ("Parts coming loose", "The chain falls off") is a
  // fragment on its own. Prefix the reporting verb so it reads as a finding
  // rather than a bullet fragment.
  if (!/^(?:it|its|they|their|this|these|the\s+\w+\s+(?:is|are|was|were|feels|seems|doesn't|don't|isn't|aren't|won't|can't|stopped|keeps|continues|breaks?|comes?|falls?|rips?|tears?|snaps?|cracks?|gets?|has|have|had|needs?|requires?|leaves?|works?|operates?|turns?|rolls?|steers?|holds?|lasts?|fits?|charges?|runs?))/i.test(text)) {
    text = `owners report ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
  }
  // Capitalise the first letter so it reads as a standalone statement.
  text = text.charAt(0).toUpperCase() + text.slice(1);
  return text;
}

/**
 * Extract every drawback clause from one owner-feedback string.
 *
 * @returns clauses in source order, de-duplicated, fragments removed.
 */
export function extractOwnerDrawbacks(productId: string, feedback: unknown): string[] {
  const out: string[] = [];

  for (const sentence of ownerSentences(feedback)) {
    if (!DRAWBACK_CUE.test(sentence)) continue;

    let clause: string | null = null;
    for (const pattern of CONTRAST_PATTERNS) {
      const match = pattern.exec(sentence);
      if (match?.[1]) {
        clause = tidyClause(clipToDrawback(match[1]));
        break;
      }
    }

    // Generic "… while others report …" frame: take the text after the LAST
    // contrast marker. "with some finding it sturdy, others report …" must
    // yield the drawback, not the benefit.
    if (!clause) {
      clause = tidyClause(clipToDrawback(lastContrastTail(sentence) ?? ""));
      if (!clause) clause = null;
    }

    // "However, <summary> … with some reporting <drawback>" — no inner contrast
    // marker, so the generic handler above cannot see it. Tried after the
    // contrast handler so a sentence containing both uses the contrast clause.
    if (!clause) {
      const match = HOWEVER_FRAME.exec(sentence);
      if (match?.[1]) {
        clause = tidyClause(clipToDrawback(match[1]));
      }
    }

    // No contrast frame: accept the sentence only when it *states* a drawback
    // — either a topic noun predicated negative ("The brakes are weak") or a
    // plain negative predication ("It is too heavy"). A positive sentence that
    // merely mentions a drawback in passing stays out.
    if (!clause && (DIRECT_DRAWBACK.test(sentence) || DIRECT_PREDICATION.test(sentence) || DIRECT_AUX_NEGATION.test(sentence))) {
      const candidate = tidyClause(sentence);
      if (candidate.length >= 16) clause = candidate;
    }

    if (!clause) continue;
    // The clause must actually state a drawback. A contrast marker is a
    // reliable *locator* but not a guarantee: in "… some finding it super easy
    // to navigate while others struggle …" the marker sits before the positive
    // half, and taking its tail would put praise in the Cons column.
    if (!isDrawbackClause(clause)) continue;
    if (clause.length < 16) continue;
    if (out.some((existing) => existing.toLowerCase() === clause!.toLowerCase())) continue;
    out.push(clause);
  }

  return out;
}

/**
 * The Cons column for a product, derived from owner feedback.
 *
 * @param limit maximum lines to return (default 3, matching the pros cap).
 * @returns [] when the record reports no drawback — callers must omit the
 *          column rather than substitute a generic caveat.
 */
export function ownerReportedCons(
  product: { id?: string; customersSay?: unknown; customers_say?: unknown } | null | undefined,
  limit = 3,
): string[] {
  if (!product) return [];
  const feedback = product.customersSay ?? product.customers_say;
  const productId = String(product.id ?? "");
  return extractOwnerDrawbacks(productId, feedback).slice(0, limit);
}