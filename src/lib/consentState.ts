/**
 * consentState.ts — where the cookie-consent decision lives, and how to read it.
 *
 * One store, one reader, one meaning.
 *
 * The site used to keep the decision in App.tsx and load analytics from a
 * hardcoded measurement id in the same file. Nothing connected the two: the
 * prerender put the GA4 snippet straight into every static page, so the
 * tracking fired before anybody had been asked, and the SPA kept a second
 * property id of its own. Consent state and analytics loading now meet in
 * this file, and the loader is told the decision instead of deciding it.
 *
 * Two keys, written by the banner:
 *   - "cookie_consent_v1"     -> "all" | "essential" | "custom"
 *   - "cookie_preferences_v1" -> JSON { essential, analytics, functional, ... }
 *
 * "Analytics is allowed" means exactly one thing: the preferences blob says
 * analytics === true. Not the choice string, not the banner having been seen,
 * not the reader having come back before. A reader who picked "essential" is
 * not a returning reader who agreed to analytics.
 */

export const COOKIE_CONSENT_KEY = "cookie_consent_v1";
export const COOKIE_PREFERENCES_KEY = "cookie_preferences_v1";

export type CookieConsentChoice = "all" | "essential" | "custom";

export interface CookiePreferences {
  essential?: boolean;
  analytics?: boolean;
  functional?: boolean;
  consentChoice?: CookieConsentChoice | string;
  updatedAt?: string;
}

/**
 * The stored preferences, or null when nothing has been decided yet (or the
 * stored value is unusable). A missing blob is not consent.
 */
export function parseCookiePreferences(raw: string | null | undefined): CookiePreferences | null {
  const text = String(raw ?? "").trim();
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as CookiePreferences;
  } catch {
    return null;
  }
}

/**
 * True only when the stored preferences explicitly allow analytics.
 */
export function hasAnalyticsConsent(preferences: CookiePreferences | null | undefined): boolean {
  return preferences?.analytics === true;
}

/**
 * The stored preferences, read from this browser. Storage access can throw
 * (private mode, blocked cookies), and a throw here must not take the page
 * down - it just means "no decision recorded".
 */
export function readCookiePreferences(): CookiePreferences | null {
  try {
    if (typeof window === "undefined") return null;
    return parseCookiePreferences(window.localStorage.getItem(COOKIE_PREFERENCES_KEY));
  } catch {
    return null;
  }
}

/**
 * The four Google Consent Mode v2 signals.
 *
 * "Denied" is the honest starting state. The site runs no advertising and no
 * remarketing, so the three ad signals never move: there is nothing to
 * consent to. The analytics signal is the only one a reader can change, and
 * only by agreeing.
 */
export interface ConsentSignals {
  ad_storage: "granted" | "denied";
  ad_user_data: "granted" | "denied";
  ad_personalization: "granted" | "denied";
  analytics_storage: "granted" | "denied";
}

/** Every signal, denied. What a page starts from. */
export const DENIED_CONSENT: ConsentSignals = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
};

/**
 * The signals that follow a reader's decision.
 *
 * Analytics follows the stored preference and nothing else. A reader who
 * picked "essential only" gets analytics denied, which in Consent Mode means
 * their visit is still counted - as a cookieless ping, with no cookie and no
 * identifier - rather than not counted at all.
 */
export function consentSignalsFor(
  preferences: CookiePreferences | null | undefined,
): ConsentSignals {
  return {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: preferences?.analytics === true ? "granted" : "denied",
  };
}

/**
 * Put a consent command into the dataLayer.
 *
 * The order matters and this is the only place that decides it: the "default"
 * has to be queued before the Google tag loads, otherwise the tag starts with
 * no state at all and stores what it likes. The "update" that follows a
 * reader's choice goes in later, and the tag picks it up from the same queue.
 *
 * The stub is installed here if it is missing, because a consent command
 * pushed before the stub exists is a command nobody will ever read.
 */
export function pushGoogleConsent(
  action: "default" | "update",
  signals: ConsentSignals,
  waitForUpdateMs?: number,
): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    };
  }
  window.gtag("consent", action, {
    ...signals,
    ...(typeof waitForUpdateMs === "number" ? { wait_for_update: waitForUpdateMs } : {}),
  });
}
