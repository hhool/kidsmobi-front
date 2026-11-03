#!/usr/bin/env node
/**
 * The tracking and affiliate pipes have to be well formed wherever they fire.
 *
 * Both are configuration-driven, which means they are usually switched OFF -
 * and a switched-off pipe is exactly the state nobody tests. The day the
 * owner pastes a measurement id into the CMS, the code that has never run
 * starts running on every page of the site. So the invariants have to hold
 * in both states, and this guard checks them in whatever state the build is
 * in:
 *
 *   1. an outbound affiliate link carries a real ASIN and a tracking tag, and
 *      declares itself as paid ("sponsored nofollow") - a paid link that
 *      does not say so is a link the search engines treat as organic;
 *   2. the SPA bundle still declares the paid-link rel, so the hydrated page
 *      agrees with the static one.
 *
 * R-910 (consent before tracking) adds the invariants that were missing, and
 * they are the ones that actually bit:
 *
 *   3. the static HTML carries NO analytics loader and no gtag('config') call
 *      at all. The prerender used to write a GA4 snippet into all 441 static
 *      pages, so the tracking fired while the HTML was being parsed - before
 *      the cookie banner was even shown, and regardless of the answer. The
 *      tag is loaded by the SPA instead, which lets it set the consent state
 *      first;
 *   4. the SPA bundle carries the consent keys, so the loader has something
 *      to consult before it fires;
 *   5. the site uses ONE measurement id. The CMS said G-52MH8KHF9T and a
 *      hardcoded constant in App.tsx said G-DT1W48PVTR, so the site was
 *      reporting into two properties and no reader could be traced. The id
 *      belongs to the CMS (or to a build-time env var), never to a literal
 *      in the code;
 *   6. the bundle runs Google's Consent Mode v2: all four signals are set,
 *      the default denies every one of them, and there is both a "default"
 *      and an "update" command. Without the denied default the tag would
 *      start measuring straight away; without the update a reader who agreed
 *      would stay denied forever;
 *   7. the bundle queues Google's commands as an `arguments` object. gtag.js
 *      reads a command only in that shape - the one its own gtag() produces -
 *      and ignores an array-shaped command as an ordinary dataLayer event.
 *      A bundle that pushes an array loads the tag, applies no consent state
 *      and sends no hit at all: a live tag and an empty property. This rule
 *      exists because that is exactly what happened (2026-11-04).
 *
 * Rules 3-7 have self-tests at the bottom of this file: each one is checked
 * against a fixture that must fail and a fixture that must pass, so a
 * widened regex or a loosened condition cannot quietly turn the guard off.
 *
 * Run: npm run check:tracking   (after `npm run build`)
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const DIST = resolve(process.env.CHECK_TRACKING_ROOT || "dist");

const problems = [];
const fail = (where, msg) => problems.push(`${where} — ${msg}`);

if (!existsSync(DIST)) {
  console.error(JSON.stringify({ ok: false, failed: ["dist missing — run npm run build first"] }, null, 2));
  process.exit(1);
}

const GA_LOADER = /googletagmanager\.com\/gtag\/js\?id=([A-Za-z0-9-]+)/g;
// Any mention of the loader at all - a snippet that builds the URL at
// runtime counts too, which is why rule 3 is about the string, not the
// <script> tag.
const GA_MENTION = /googletagmanager\.com\/gtag\/js/g;
const GA_CONFIG = /gtag\(\s*['"]config['"]/g;
const AFFILIATE = /https:\/\/www\.amazon\.com\/dp\/([A-Z0-9]{10})\?tag=([A-Za-z0-9-]+)/g;
// A GA4 measurement id written into the bundle. "G-XXXXXXXXXX" is the admin
// panel's placeholder for the field, not a property, so it is exempt.
const GA_LITERAL = /G-[A-Z0-9]{10}/g;
const GA_PLACEHOLDER = /^G-X+$/;
const CONSENT_KEYS = ["cookie_preferences_v1", "cookie_consent_v1"];
// Google reads a command from the dataLayer only when it arrives as an
// `arguments` object - the shape Google's own gtag() produces. A command
// pushed as a plain array is treated as an ordinary dataLayer event and is
// silently ignored: the tag loads, never configures itself, and measures
// nothing. The symptom is a live tag and an empty property.
const DATA_LAYER_ARGUMENTS = /dataLayer\.push\(\s*arguments\s*\)/;

// The four Google Consent Mode v2 signals, and the state a page starts in.
const CONSENT_SIGNALS = [
  "ad_storage",
  "ad_user_data",
  "ad_personalization",
  "analytics_storage",
];

/**
 * Does the code contain one object literal that denies every consent signal?
 *
 * The default has to be "denied" for all four, otherwise the tag starts
 * storing cookies before anybody has answered the banner. The object is
 * searched for rather than the whole file, because the same bundle also
 * carries the granted path - the update that follows a reader's choice - and
 * that one is supposed to say "granted".
 */
function hasDeniedConsentDefault(code) {
  const literals = code.match(/\{[^{}]{0,600}\}/g) || [];
  return literals.some((literal) =>
    CONSENT_SIGNALS.every((signal) =>
      new RegExp(`["']?${signal}["']?\\s*:\\s*["']denied["']`).test(literal),
    ),
  );
}

/**
 * Is there a consent command with this action? ("default" / "update")
 *
 * The built bundle is minified, so the two halves are looked for separately:
 * the call that sends the consent command, and the call that passes the
 * action. `gtag("consent", action, {...})` compiles to something like
 * `window.gtag("consent", e, {...})` with the action arriving as an
 * argument, so the two never sit next to each other in the output - and
 * with optional chaining the call becomes `(i=window.gtag)==null||
 * i.call(window,"consent",e,{...})`. All three shapes are accepted, because
 * the guard has to keep biting whatever the minifier decides to emit.
 */
const CONSENT_CALL_SHAPES = [
  /gtag\??\.\(\s*["']consent["']/,
  /\(\s*window\s*,\s*["']consent["']/,
  /gtag\(\s*["']consent["']/,
];

function hasConsentCommand(code, action) {
  const sendsConsent = CONSENT_CALL_SHAPES.some((shape) => shape.test(code));
  const passesAction = new RegExp(`\\(\\s*["']${action}["']`).test(code);
  return sendsConsent && passesAction;
}

/**
 * Rules 1-3 for one page of static HTML.
 *
 * The static HTML must be free of analytics. The tag is loaded by the SPA,
 * which sets the consent default before the tag loads - a snippet in the
 * static HTML would fire first, with no consent state to obey.
 */
function checkPageAnalytics(html) {
  const found = [];
  const mentions = [...html.matchAll(GA_MENTION)];
  const configs = [...html.matchAll(GA_CONFIG)];

  if (mentions.length) {
    found.push(
      `carries an analytics loader (${mentions.length} mention(s)) - the static HTML must ship no analytics, the SPA loads the tag after it has set the consent state`,
    );
  }
  if (configs.length) {
    found.push(
      `carries ${configs.length} gtag('config') call(s) - the static HTML must ship no analytics, the SPA loads the tag after it has set the consent state`,
    );
  }

  return { problems: found, loaders: mentions.length };
}

/**
 * Rules 2, 4, 5 and 6 for the SPA bundle.
 */
function checkSpaBundle(code, configuredId) {
  const found = [];
  if (!code.includes("sponsored nofollow")) {
    found.push("the SPA bundle no longer declares rel=\"sponsored nofollow\" on the affiliate link");
  }
  if (!code.includes("googletagmanager.com/gtag/js")) {
    found.push("the SPA bundle no longer contains the analytics snippet");
  }
  for (const key of CONSENT_KEYS) {
    if (!code.includes(key)) {
      found.push(`the SPA bundle never reads "${key}" - the analytics loader has no consent state to consult`);
    }
  }
  const literals = [
    ...new Set([...code.matchAll(GA_LITERAL)].map((m) => m[0]).filter((id) => !GA_PLACEHOLDER.test(id))),
  ];
  if (literals.length > 1) {
    found.push(`the bundle pins ${literals.length} measurement ids (${literals.join(", ")}) - the site must use exactly one`);
  } else if (literals.length === 1 && configuredId && literals[0] !== configuredId) {
    found.push(
      `the bundle pins measurement id "${literals[0]}" but the CMS is configured with "${configuredId}" - the site would report into two properties`,
    );
  } else if (literals.length === 1 && !configuredId) {
    found.push(
      `the bundle pins measurement id "${literals[0]}" but no id is configured in the CMS - put it in settings.seoGlobal.gaMeasurementId so there is one source of truth`,
    );
  }

  // Rule 6. Consent Mode v2.
  const missingSignals = CONSENT_SIGNALS.filter(
    (signal) => !new RegExp(`["']?${signal}["']?\\s*:`).test(code),
  );
  if (missingSignals.length) {
    found.push(
      `the bundle never sets ${missingSignals.join(", ")} - Consent Mode v2 needs all four signals`,
    );
  }
  if (!hasDeniedConsentDefault(code)) {
    found.push(
      "the bundle has no consent state that denies every signal - without it the tag measures before anybody agreed",
    );
  }
  if (!hasConsentCommand(code, "default")) {
    found.push("the bundle never sends the consent default - the tag would start with no state at all");
  }
  if (!hasConsentCommand(code, "update")) {
    found.push("the bundle never sends a consent update - a reader who agreed would stay denied");
  }
  if (!code.includes("wait_for_update")) {
    found.push(
      "the bundle does not wait for the consent decision - the tag would fire before the banner is answered",
    );
  }
  if (!DATA_LAYER_ARGUMENTS.test(code)) {
    found.push(
      "the bundle does not queue Google's commands as an `arguments` object - gtag.js reads commands only in that shape, so an array-shaped command is ignored and the tag measures nothing",
    );
  }

  return found;
}

/** The measurement id the site is configured with, from the CMS snapshot. */
function readConfiguredMeasurementId() {
  const snapshot = resolve(process.cwd(), "scripts/cms-snapshots/settings.json");
  if (!existsSync(snapshot)) return "";
  try {
    const parsed = JSON.parse(readFileSync(snapshot, "utf8"));
    const data = Array.isArray(parsed?.data) ? parsed.data[0] : parsed?.data;
    const id = String(data?.seoGlobal?.gaMeasurementId || "").trim();
    return /^G-[A-Za-z0-9]{4,20}$/.test(id) ? id : "";
  } catch {
    return "";
  }
}

/**
 * Self-tests for the rules above. A guard that cannot prove it still bites
 * is a guard that will be "simplified" one day into a guard that does not.
 */
function runSelfTests() {
  const failures = [];
  const expect = (name, condition, detail) => {
    if (!condition) failures.push(`${name}${detail ? " — " + detail : ""}`);
  };

  // --- the static HTML must be free of analytics ---------------------------
  const withLoader = `<html><head>
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-52MH8KHF9T"></script>
    <script>gtag('config', 'G-52MH8KHF9T');</script>
  </head></html>`;
  expect(
    "an analytics loader in the static HTML must be reported",
    checkPageAnalytics(withLoader).problems.length > 0,
    "the loader was accepted",
  );

  const withRuntimeLoader = `<html><head>
    <script>
      var s = document.createElement('script');
      s.src = 'https://www.googletagmanager.com/gtag/js?id=G-52MH8KHF9T';
    </script>
  </head></html>`;
  expect(
    "a runtime-built loader in the static HTML must be reported",
    checkPageAnalytics(withRuntimeLoader).problems.length > 0,
  );

  const withConfigOnly = `<html><head><script>gtag('config','G-52MH8KHF9T');</script></head></html>`;
  expect(
    "a gtag('config') call in the static HTML must be reported",
    checkPageAnalytics(withConfigOnly).problems.length > 0,
  );

  const cleanPage = `<html><head><title>Balance Bike Toddler</title></head><body></body></html>`;
  expect(
    "a page without analytics must pass",
    checkPageAnalytics(cleanPage).problems.length === 0,
    JSON.stringify(checkPageAnalytics(cleanPage).problems),
  );

  // --- the bundle rules ----------------------------------------------------
  // The fixtures below are written the way the minified bundle looks, so the
  // guard is tested against the shape it will actually meet.
  const consentMode =
    'const Uf={ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied",analytics_storage:"denied"};' +
    'function zo(e,t,a){(i=window.gtag)==null||i.call(window,"consent",e,{...t,...typeof a=="number"?{wait_for_update:a}:{}})}' +
    'zo("default",Uf,500)';
  const consentUpdate = 'zo("update",eh(prefs))';
  // The stub, the way the minified bundle carries it: the command reaches
  // the queue as an `arguments` object, which is the shape gtag.js reads.
  const dataLayerStub =
    'window.gtag=window.gtag||function gtag(){window.dataLayer.push(arguments)}';
  const cleanBundle = [
    "googletagmanager.com/gtag/js",
    "cookie_preferences_v1",
    "cookie_consent_v1",
    "sponsored nofollow",
    consentMode,
    consentUpdate,
    dataLayerStub,
  ].join(" ");

  expect(
    "a bundle that runs Consent Mode v2 must pass",
    checkSpaBundle(cleanBundle, "G-52MH8KHF9T").length === 0,
    JSON.stringify(checkSpaBundle(cleanBundle, "G-52MH8KHF9T")),
  );
  expect(
    "a bundle pinning a second property must be reported",
    checkSpaBundle(`${cleanBundle} "G-DT1W48PVTR"`, "G-52MH8KHF9T").length > 0,
  );
  expect(
    "a bundle pinning the configured property must pass",
    checkSpaBundle(`${cleanBundle} "G-52MH8KHF9T"`, "G-52MH8KHF9T").length === 0,
  );
  expect(
    "the admin placeholder must not count as a pinned property",
    checkSpaBundle(`${cleanBundle} "G-XXXXXXXXXX"`, "G-52MH8KHF9T").length === 0,
  );
  expect(
    "a bundle without the consent keys must be reported",
    checkSpaBundle("googletagmanager.com/gtag/js sponsored nofollow", "G-52MH8KHF9T").length > 0,
  );

  const grantedByDefault = cleanBundle.replace(
    'analytics_storage:"denied"',
    'analytics_storage:"granted"',
  );
  expect(
    "a bundle that grants analytics by default must be reported",
    checkSpaBundle(grantedByDefault, "G-52MH8KHF9T").length > 0,
  );

  const noDefault = cleanBundle.replace(consentMode, "");
  expect(
    "a bundle without the consent default must be reported",
    checkSpaBundle(noDefault, "G-52MH8KHF9T").length > 0,
  );

  const noUpdate = cleanBundle.replace(consentUpdate, "");
  expect(
    "a bundle without the consent update must be reported",
    checkSpaBundle(noUpdate, "G-52MH8KHF9T").length > 0,
  );

  const noWait = cleanBundle.replace("wait_for_update:a", "send_after:a");
  expect(
    "a bundle that does not wait for the decision must be reported",
    checkSpaBundle(noWait, "G-52MH8KHF9T").length > 0,
  );

  const missingSignal = cleanBundle.replace(/ad_user_data:"denied",/, "");
  expect(
    "a bundle missing one of the four signals must be reported",
    checkSpaBundle(missingSignal, "G-52MH8KHF9T").length > 0,
  );

  // The bug this rule was written for: the stub queued the command as an
  // array, gtag.js ignored every command, the tag loaded and measured
  // nothing, and the property stayed empty.
  const arrayShapedCommand = cleanBundle.replace(
    "dataLayer.push(arguments)",
    "dataLayer.push(o)",
  );
  expect(
    "a bundle that queues Google's commands as an array must be reported",
    checkSpaBundle(arrayShapedCommand, "G-52MH8KHF9T").length > 0,
  );

  if (failures.length) {
    console.error(
      JSON.stringify({ ok: false, failed: ["check-tracking self-tests failed"], selfTestFailures: failures }, null, 2),
    );
    process.exit(1);
  }
}

runSelfTests();

let pages = 0;
let withAnalytics = 0;
let withAffiliate = 0;
let affiliateLinks = 0;
let staticLoaders = 0;

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

for (const file of walk(DIST)) {
  const html = readFileSync(file, "utf8");
  const rel = file.slice(DIST.length + 1).split("\\").join("/");
  pages += 1;

  const page = checkPageAnalytics(html);
  for (const problem of page.problems) fail(rel, problem);
  if (page.loaders > 0) staticLoaders += page.loaders;
  if ([...html.matchAll(GA_LOADER)].length === 1) withAnalytics += 1;

  // 1. the affiliate links
  const links = [...html.matchAll(AFFILIATE)];
  if (links.length) {
    withAffiliate += 1;
    affiliateLinks += links.length;
    for (const link of links) {
      // The anchor has to declare itself as paid. Find the anchor that
      // carries this URL and check its rel.
      const anchorRe = new RegExp(
        `<a[^>]*href="${link[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>`,
        "i",
      );
      const anchor = anchorRe.exec(html);
      if (!anchor) {
        fail(rel, `the affiliate URL ${link[0]} is not inside an anchor`);
        continue;
      }
      const rel = (/\brel="([^"]*)"/.exec(anchor[0]) || [])[1] || "";
      if (!/sponsored/.test(rel)) {
        fail(rel, `the affiliate link does not declare rel="sponsored" (found rel="${rel}")`);
      }
      if (!/nofollow/.test(rel)) {
        fail(rel, `the affiliate link does not declare rel="nofollow" (found rel="${rel}")`);
      }
    }
  }
}

// 2. the SPA must declare the paid-link rel too, so the hydrated page agrees
// with the static one.
const assets = join(DIST, "assets");
if (existsSync(assets)) {
  // Every chunk, not just the entry one: the product view is lazy-loaded, so
  // the affiliate link lives in its own chunk.
  const chunks = readdirSync(assets).filter((f) => f.endsWith(".js"));
  const code = chunks.map((f) => readFileSync(join(assets, f), "utf8")).join("\n");
  if (!chunks.length) {
    fail("spa", "no JavaScript chunks were found in dist/assets");
  } else {
    for (const problem of checkSpaBundle(code, readConfiguredMeasurementId())) {
      fail("spa", problem);
    }
  }
}

const ok = problems.length === 0;
console.log(
  JSON.stringify(
    {
      ok,
      pagesChecked: pages,
      pagesWithAnalytics: withAnalytics,
      staticAnalyticsLoaders: staticLoaders,
      pagesWithAffiliate: withAffiliate,
      affiliateLinks,
      state:
        staticLoaders === 0
          ? "the static HTML ships no analytics - GA4 is loaded by the SPA in Consent Mode v2 (default: every signal denied)"
          : "the static HTML carries an analytics loader, which must not happen",
      problems,
    },
    null,
    2,
  ),
);
process.exit(ok ? 0 : 1);
