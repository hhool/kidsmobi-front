import React, { useState } from "react";
import { isStaticDocument } from "../lib/staticDocument";

interface CookieConsentModalProps {
  lang: "zh" | "en";
  onAcceptAll: () => void;
  onEssentialOnly: () => void;
  onSavePreferences: (preferences: { analytics: boolean; functional: boolean }) => void;
}

/**
 * Is this the static homepage document?
 *
 * The document has no React, so the modal's buttons are wired by the
 * enhancement script that ships with it (scripts/build-static-home.mjs). The
 * script needs stable hooks to find the banner and its buttons, which is
 * what the data-bbt-consent-* attributes are for. They are harmless in the
 * SPA, where the React handlers do the work.
 */
const STATIC_DOCUMENT = isStaticDocument();

export default function CookieConsentModal({
  lang: _lang,
  onAcceptAll,
  onEssentialOnly,
  onSavePreferences,
}: CookieConsentModalProps) {
  const [showPreferences, setShowPreferences] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [functionalEnabled, setFunctionalEnabled] = useState(true);

  // In the document the preferences panel has to exist in the markup even
  // while it is closed, because the script that opens it has nothing to
  // un-hide otherwise. The SPA keeps the old behaviour: the panel is not
  // rendered until the reader asks for it.
  const panelVisible = showPreferences;
  const panelHiddenClass = STATIC_DOCUMENT && !panelVisible ? " hidden" : "";

  return (
    // WHY THIS IS NOT A FULL-SCREEN OVERLAY
    //
    // It used to be: `fixed inset-0 z-[120] bg-slate-950/55 backdrop-blur-sm
    // flex items-end sm:items-center justify-center`. That shape was measured
    // and it was the reason the homepage could not pass its own performance
    // budget - and it was bad for the reader as well.
    //
    // 1. It made the CONSENT TEXT the Largest Contentful Paint element. The
    //    Lighthouse trace of the static homepage showed the hero photograph
    //    painted at 522 ms, and not one LCP candidate for it - the only
    //    candidate in the whole trace was the modal's paragraph. A reader
    //    arriving on the homepage saw a cookie dialog, and the metric
    //    measured the cookie dialog.
    // 2. The backdrop blur forced a rasterisation of the whole viewport
    //    behind it, and the overlay's own layout cost a single full layout
    //    of 1,020 objects.
    // 3. For a first-time visitor it is the worst possible first impression:
    //    the homepage is hidden behind a translucent wall.
    //
    // The banner now sits at the bottom of the viewport, over the page
    // footer rather than over the hero, and it dims nothing. It still asks
    // the same three questions and it still has to be answered before
    // anything non-essential is stored - only its shape changed.
    <div
      data-bbt-consent-banner="1"
      className="fixed inset-x-0 bottom-0 z-[120] flex justify-center p-3 sm:p-6 pointer-events-none"
    >
      <div className="pointer-events-auto w-full max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-5 sm:p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <h3 className="text-base sm:text-lg font-black text-slate-900">
          Privacy & Cookie Preferences (GDPR Compliant)
        </h3>
        <p className="text-[11px] sm:text-xs text-slate-600 mt-1">(Privacy and Cookie Preference Settings)</p>

        <p className="mt-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
          We use encrypted local variables and essential cookies to power your experience. Accepting cookies enables personalized product bookmarking, dynamic comparison tools, and PDF data sheet downloads.
        </p>

        <p className="mt-2 text-[11px] sm:text-xs text-slate-500">
          Learn more in our <a className="text-orange-700 font-bold hover:underline" href="/transparency/privacy-policy/">Privacy Policy</a>.
        </p>

        {(showPreferences || STATIC_DOCUMENT) && (
          <div
            data-bbt-consent-panel="1"
            className={`mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3${panelHiddenClass}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-900">Essential Cookies</p>
                <p className="text-xs text-slate-500">Required for core site functions and security. Always active.</p>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-black uppercase">Always On</span>
            </div>

            <label className="flex items-start justify-between gap-3 cursor-pointer">
              <div>
                <p className="text-sm font-black text-slate-900">Functional Preferences</p>
                <p className="text-xs text-slate-500">Remember language and display preferences across visits.</p>
              </div>
              <input
                data-bbt-consent-functional="1"
                type="checkbox"
                checked={functionalEnabled}
                onChange={(event) => setFunctionalEnabled(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
              />
            </label>

            <label className="flex items-start justify-between gap-3 cursor-pointer">
              <div>
                <p className="text-sm font-black text-slate-900">Analytics Preferences</p>
                <p className="text-xs text-slate-500">Help us improve feature quality and performance.</p>
              </div>
              <input
                data-bbt-consent-analytics="1"
                type="checkbox"
                checked={analyticsEnabled}
                onChange={(event) => setAnalyticsEnabled(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
              />
            </label>

            <div className="pt-1">
              <button
                data-bbt-consent-action="save"
                onClick={() => onSavePreferences({ analytics: analyticsEnabled, functional: functionalEnabled })}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wide"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-col sm:flex-row gap-2.5 sm:items-center">
          <button
            data-bbt-consent-action="all"
            onClick={onAcceptAll}
            className="px-5 py-2.5 rounded-xl bg-orange-700 hover:bg-orange-800 text-white text-xs font-black uppercase tracking-wide"
          >
            Accept All Cookies
          </button>
          <button
            data-bbt-consent-action="custom"
            onClick={() => setShowPreferences((prev) => !prev)}
            className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-black uppercase tracking-wide"
          >
            {showPreferences ? "Hide Preferences" : "Custom Preferences"}
          </button>
          <button
            data-bbt-consent-action="essential"
            onClick={onEssentialOnly}
            className="px-2 py-2 text-xs text-slate-600 hover:text-slate-900 font-bold underline underline-offset-2"
          >
            Decline Non-Essential
          </button>
        </div>
      </div>
    </div>
  );
}
