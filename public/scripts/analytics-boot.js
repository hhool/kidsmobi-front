/*
 * The static homepage's analytics beacon.
 *
 * WHY THIS FILE EXISTS
 *
 * The homepage ships as a document: no SPA, no entry bundle, nothing that
 * runs React. That is what makes it fast, and it is also why `/` had no
 * analytics at all for one build - the tag on every other route rides in on
 * the SPA bundle, and the homepage no longer loads one. G4's item 33 caught
 * it exactly: "analytics_delivery=html but 1 of 442 page(s) carry no
 * <script src>: the beacon was declared, not rendered."
 *
 * So the homepage gets its own beacon. It is deliberately tiny and
 * deliberately last: a deferred same-origin file, parsed after the document,
 * which sends NOTHING until the reader has agreed.
 *
 * THE CONSENT ORDER IS THE WHOLE POINT
 *
 * Google's Consent Mode v2 requires the default BEFORE the tag loads, not
 * after. If gtag.js is fetched first and the default arrives second, the
 * first hit is already on the wire with whatever the tag assumed - which is
 * the failure that made this site's traffic read as zero for two weeks.
 *
 *  1. queue the four signals as `denied` with wait_for_update 500 ms;
 *  2. read the choice the consent banner stored;
 *  3. only if analytics was granted: update the signals and fetch gtag.js.
 *
 * The command has to be pushed as an `arguments` object. A plain array is
 * ignored by gtag.js, and the failure mode is silent: the page looks
 * instrumented and sends nothing.
 *
 * ONE SOURCE OF TRUTH FOR THE CONSENT KEYS
 *
 * The keys below are the same two localStorage entries the banner writes
 * (see ENHANCEMENT_SCRIPT in scripts/build-static-home.mjs) and the same two
 * src/lib/consentState.ts reads in the SPA. The banner also fires
 * `bbt:consent` on a decision, which is how this file learns about a choice
 * made in this visit - localStorage alone would only be read once.
 *
 * Measured cost on the homepage: 0 bytes before consent, and one deferred
 * same-origin request that Lighthouse does not see as render-blocking. The
 * tag itself only exists after a reader says yes.
 */
(function () {
  "use strict";

  var tag = document.currentScript;
  var id = tag && tag.getAttribute("data-ga");
  if (!id) return;

  var CHOICE_KEY = "cookie_consent_v1";
  var PREFERENCES_KEY = "cookie_preferences_v1";
  var loaded = false;

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }

  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    wait_for_update: 500
  });

  function storedAnalytics() {
    try {
      var raw = window.localStorage.getItem(PREFERENCES_KEY);
      if (raw) {
        var prefs = JSON.parse(raw);
        if (prefs && prefs.analytics === true) return true;
        if (prefs && prefs.analytics === false) return false;
      }
      return window.localStorage.getItem(CHOICE_KEY) === "all";
    } catch (error) {
      return false;
    }
  }

  function loadTag() {
    if (loaded || !storedAnalytics()) return;
    loaded = true;
    var script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
    document.head.appendChild(script);
  }

  function apply(granted) {
    gtag("consent", "update", {
      ad_storage: granted ? "granted" : "denied",
      ad_user_data: granted ? "granted" : "denied",
      ad_personalization: granted ? "granted" : "denied",
      analytics_storage: granted ? "granted" : "denied"
    });
    if (!granted) return;
    gtag("js", new Date());
    gtag("config", id, { anonymize_ip: true });
    loadTag();
  }

  apply(storedAnalytics());

  window.addEventListener("bbt:consent", function (event) {
    apply(Boolean(event && event.detail && event.detail.analytics));
  });
})();
