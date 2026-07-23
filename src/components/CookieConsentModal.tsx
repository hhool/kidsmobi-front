import React, { useState } from "react";

interface CookieConsentModalProps {
  lang: "zh" | "en";
  onAcceptAll: () => void;
  onEssentialOnly: () => void;
  onSavePreferences: (preferences: { analytics: boolean; functional: boolean }) => void;
}

export default function CookieConsentModal({
  lang: _lang,
  onAcceptAll,
  onEssentialOnly,
  onSavePreferences,
}: CookieConsentModalProps) {
  const [showPreferences, setShowPreferences] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [functionalEnabled, setFunctionalEnabled] = useState(true);

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <h3 className="text-lg sm:text-xl font-black text-slate-900">
          Privacy & Cookie Preferences (GDPR Compliant)
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">(Privacy and Cookie Preference Settings)</p>

        <p className="mt-4 text-sm text-slate-700 leading-relaxed">
          We use encrypted local variables and essential cookies to power your experience. Accepting cookies enables personalized product bookmarking, dynamic comparison tools, and instant downloads of certified lab evaluation reports.
        </p>

        <p className="mt-3 text-xs text-slate-500">
          Learn more in our <a className="text-orange-600 font-bold hover:underline" href="/auth">Privacy Policy</a>.
        </p>

        {showPreferences && (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
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
                type="checkbox"
                checked={analyticsEnabled}
                onChange={(event) => setAnalyticsEnabled(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
              />
            </label>

            <div className="pt-1">
              <button
                onClick={() => onSavePreferences({ analytics: analyticsEnabled, functional: functionalEnabled })}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wide"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-2.5 sm:items-center">
          <button
            onClick={onAcceptAll}
            className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-wide"
          >
            Accept All Cookies
          </button>
          <button
            onClick={() => setShowPreferences((prev) => !prev)}
            className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-black uppercase tracking-wide"
          >
            {showPreferences ? "Hide Preferences" : "Custom Preferences"}
          </button>
          <button
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
