/**
 * trackingConfig.ts — where the analytics id and the affiliate tag come from,
 * and how the two are rendered.
 *
 * Both values are runtime configuration, not build-time constants:
 *
 *   - the CMS `settings.seoGlobal` object wins, so the site owner can fill
 *     them in from the admin panel and have them live without a redeploy;
 *   - an environment variable is the fallback, for a build-time default and
 *     for local development where there is no CMS.
 *
 * One id, one place. The static HTML used to carry a GA4 snippet of its own
 * while the SPA loaded a second, hardcoded property - two properties, half a
 * pageview each, and tracking that started before the cookie banner was ever
 * shown. The static HTML now ships no analytics script at all: the id is read
 * from configuration at runtime and the loader below is only called once the
 * reader has agreed to analytics (see lib/consentState.ts).
 *
 * Nothing here sends anything by itself. The site only loads a tag when an id
 * has actually been configured - an unconfigured site stays script-free, and
 * that is also what keeps a privacy-conscious reader from being tracked by
 * accident. Whether a reader is measured in full or only counted as a
 * cookieless ping is decided by the consent state, not here (see
 * lib/consentState.ts).
 */

import {
  DENIED_CONSENT,
  ensureGoogleTag,
  pushGoogleConsent,
  type ConsentSignals,
} from "./consentState";

export interface SeoGlobalLike {
  siteOrigin?: string;
  googleSiteVerification?: string;
  defaultRobots?: string;
  /** Google Analytics 4 measurement id, e.g. "G-ABC1234DEF". */
  gaMeasurementId?: string;
  /** Amazon Associates tracking id, e.g. "kidsmobi-20". */
  amazonTag?: string;
  [key: string]: unknown;
}

export interface SettingsLike {
  seoGlobal?: SeoGlobalLike;
  [key: string]: unknown;
}

/** A GA4 measurement id: "G-" followed by alphanumerics. */
const GA_ID = /^G-[A-Za-z0-9]{4,20}$/;

/**
 * An Amazon Associates tracking id: a lowercase-ish store id optionally
 * followed by "-20". We keep it deliberately loose on the store part (it is
 * the account owner's choice) but strict on the length and characters, so a
 * stray value can never end up inside a URL.
 */
const AMAZON_TAG = /^[A-Za-z0-9][A-Za-z0-9-]{1,30}$/;

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

/**
 * The GA4 measurement id to use, or "" when none is configured.
 * The CMS value wins over the environment so the admin panel can change it
 * without a redeploy.
 */
export function resolveGaMeasurementId(
  settings: SettingsLike | null | undefined,
  env: Record<string, unknown> = {},
): string {
  const fromCms = clean(settings?.seoGlobal?.gaMeasurementId);
  if (GA_ID.test(fromCms)) return fromCms;
  const fromEnv = clean(env.VITE_GA_MEASUREMENT_ID);
  if (GA_ID.test(fromEnv)) return fromEnv;
  return "";
}

/**
 * The Amazon Associates tracking id to use, or "" when none is configured.
 */
export function resolveAmazonTag(
  settings: SettingsLike | null | undefined,
  env: Record<string, unknown> = {},
): string {
  const fromCms = clean(settings?.seoGlobal?.amazonTag);
  if (AMAZON_TAG.test(fromCms)) return fromCms;
  const fromEnv = clean(env.VITE_AMAZON_ASSOCIATE_TAG);
  if (AMAZON_TAG.test(fromEnv)) return fromEnv;
  return "";
}

/**
 * The ASIN of a product, or "" when it cannot be found.
 *
 * The catalogue stores the ASIN twice: inside the product id
 * ("kids_bikes-b0c772bkg2") and, spelled out, inside the store image URL
 * (".../Rank_6_ASIN_B0C772BKG2_.../images/primary.jpg"). The explicit form
 * wins; the id form is the fallback.
 */
export function asinFromProduct(input: {
  id?: unknown;
  imageUrl?: unknown;
  source?: unknown;
}): string {
  const explicit = /ASIN_([A-Z0-9]{10})(?:[^A-Z0-9]|$)/.exec(
    clean(input.imageUrl) + " " + clean(input.source),
  );
  if (explicit) return explicit[1];
  const tail = clean(input.id).split("-").pop() || "";
  if (/^[A-Za-z0-9]{10}$/.test(tail) && /\d/.test(tail)) return tail.toUpperCase();
  return "";
}

/**
 * The Amazon product URL for a product, or "" when the product has no ASIN
 * or no tracking id is configured.
 *
 * rel="sponsored nofollow" is what the search engines expect of a paid
 * outbound link, and the caller is responsible for putting it on the anchor.
 */
export function amazonAffiliateUrl(
  input: { id?: unknown; imageUrl?: unknown; source?: unknown },
  tag: string,
): string {
  const asin = asinFromProduct(input);
  const cleanTag = clean(tag);
  if (!asin || !AMAZON_TAG.test(cleanTag)) return "";
  return `https://www.amazon.com/dp/${asin}?tag=${encodeURIComponent(cleanTag)}`;
}

/**
 * Load gtag.js for a measurement id.
 *
 * The function does not decide whether the reader may be tracked - the
 * consent state does, and it is set here as well so the order is right:
 *
 *   1. the consent default ("denied") is queued FIRST, before the tag loads,
 *      so the tag never runs without a state to obey;
 *   2. a decision the reader already made is queued next, so a returning
 *      reader's first pageview is a full one and not a ping;
 *   3. only then does the tag load, and it configures itself.
 *
 * The tag loads for every reader, which is what Google asks for in Consent
 * Mode: before consent the reader is counted by a cookieless ping (no
 * cookie, no identifier), and after consent the same tag switches to full
 * measurement. A tag that only ever loads after consent - "basic consent
 * mode" - hands Google nothing at all for the readers who decline, and the
 * traffic simply vanishes from the property.
 *
 * Returns true when the script was added, false when there was nothing to do
 * (no id, no DOM, or the script is already on the page). Calling it twice
 * with the same id therefore cannot double-count a pageview.
 *
 * `async` on the loader: a slow or blocked Google endpoint must not hold up
 * the page, and the site's own content is what matters first.
 */
export function loadGoogleAnalyticsScript(
  measurementId: string,
  initial?: ConsentSignals,
): boolean {
  const id = clean(measurementId);
  if (!GA_ID.test(id)) return false;
  if (typeof document === "undefined") return false;
  if (document.querySelector(`script[data-google-analytics="${id}"]`)) return false;

  // The stub has to exist before the consent commands are queued, and both
  // have to exist before the tag loads. The stub lives in consentState.ts so
  // that there is exactly one definition of how a command is queued.
  ensureGoogleTag();

  // 1. Nothing is granted yet. 500ms is how long the tag waits for a reader
  //    to answer the banner before it sends the cookieless ping.
  pushGoogleConsent("default", DENIED_CONSENT, 500);

  // 2. A decision that was already made, applied before the config so the
  //    first pageview of a returning reader is a full one.
  if (initial) pushGoogleConsent("update", initial);

  // 3. The tag.
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  script.dataset.googleAnalytics = id;
  document.head.appendChild(script);

  // 4. The two standard commands. They go through the same stub, so they
  //    reach the queue in the shape Google reads.
  window.gtag?.("js", new Date());
  window.gtag?.("config", id);
  return true;
}

/**
 * Tell the tag what the reader just decided.
 *
 * Granted switches analytics storage on for the rest of the visit. Denied
 * leaves it denied - the visit is still counted, but as a cookieless ping.
 */
export function updateGoogleConsentMode(signals: ConsentSignals): void {
  pushGoogleConsent("update", signals);
}
