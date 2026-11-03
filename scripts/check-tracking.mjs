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
 *   1. a page carries AT MOST ONE analytics snippet, and a snippet carries a
 *      real measurement id that matches the one it configures;
 *   2. an outbound affiliate link carries a real ASIN and a tracking tag, and
 *      declares itself as paid ("sponsored nofollow") - a paid link that
 *      does not say so is a link the search engines treat as organic;
 *   3. the SPA bundle still declares the paid-link rel, so the hydrated page
 *      agrees with the static one.
 *
 * R-910 (consent before tracking) adds the invariants that were missing, and
 * they are the ones that actually bit:
 *
 *   4. the static HTML carries NO analytics loader. The prerender used to
 *      write a GA4 snippet into all 441 static pages, so the tracking fired
 *      while the HTML was being parsed - before the cookie banner was even
 *      shown, and regardless of the answer (R-910). A loader may only appear
 *      inside an explicit consent gate;
 *   5. the SPA bundle carries the consent keys, so the loader has something
 *      to consult before it fires;
 *   6. the site uses ONE measurement id. The CMS said G-52MH8KHF9T and a
 *      hardcoded constant in App.tsx said G-DT1W48PVTR, so the site was
 *      reporting into two properties and no reader could be traced. The id
 *      belongs to the CMS (or to a build-time env var), never to a literal
 *      in the code.
 *
 * Rules 4-6 have self-tests at the bottom of this file: each one is checked
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
const GA_CONFIG = /gtag\('config',\s*["']([^"']+)["']\)/g;
// Any mention of the loader at all - a snippet that builds the URL at
// runtime counts too, which is why rule 4 is about the string, not the
// <script> tag.
const GA_MENTION = /googletagmanager\.com\/gtag\/js/g;
const AFFILIATE = /https:\/\/www\.amazon\.com\/dp\/([A-Z0-9]{10})\?tag=([A-Za-z0-9-]+)/g;
// A GA4 measurement id written into the bundle. "G-XXXXXXXXXX" is the admin
// panel's placeholder for the field, not a property, so it is exempt.
const GA_LITERAL = /G-[A-Z0-9]{10}/g;
const GA_PLACEHOLDER = /^G-X+$/;
const CONSENT_KEYS = ["cookie_preferences_v1", "cookie_consent_v1"];
// The marker a consent-gated static snippet has to carry. Rule 4 only allows
// a loader in the static HTML when it sits inside a block marked with it.
const CONSENT_GATE_ID = "bb-analytics-consent-gate";

/** The character ranges covered by the consent-gate script blocks in a page. */
function consentGateSpans(html) {
  const spans = [];
  const re = new RegExp(`<script[^>]*id="${CONSENT_GATE_ID}"[^>]*>[\\s\\S]*?</script>`, "gi");
  let match;
  while ((match = re.exec(html)) !== null) {
    spans.push([match.index, match.index + match[0].length, match[0]]);
  }
  return spans;
}

/**
 * Rules 1 and 4 for one page of static HTML.
 *
 * Returns the list of problems found (empty when the page is fine) and the
 * number of analytics loaders it carries.
 *
 * A snippet inside a consent gate is held to a looser rule on purpose: the
 * gate builds the URL and the gtag call at runtime, so there is no static
 * `gtag('config', ...)` to pair it with. A snippet OUTSIDE a gate is the
 * classic inline pair, and has to look like one.
 */
function checkPageAnalytics(html) {
  const found = [];
  const gates = consentGateSpans(html);
  const isGated = (index) => gates.some(([start, end]) => index >= start && index < end);

  const mentions = [...html.matchAll(GA_MENTION)];
  const loaders = [...html.matchAll(GA_LOADER)];
  const configs = [...html.matchAll(GA_CONFIG)];
  const ungatedLoaders = loaders.filter((loader) => !isGated(loader.index));
  const ungatedConfigs = configs.filter((config) => !isGated(config.index));

  // Rule 4. A loader in the static HTML fires while the page is being
  // parsed, which is before the cookie banner can be answered. The only way
  // a loader may live in the static HTML is inside an explicit consent gate
  // that reads the stored decision first.
  if (mentions.length) {
    if (!gates.length) {
      found.push(
        `carries an analytics loader outside a consent gate (${mentions.length} mention(s)) - the tracking fires before the reader has agreed to anything`,
      );
    } else {
      const outside = mentions.some((mention) => !isGated(mention.index));
      if (outside) {
        found.push("carries an analytics loader outside the consent-gated block");
      } else if (!gates[0][2].includes("cookie_preferences_v1")) {
        found.push("the consent gate does not read the stored analytics decision");
      }
    }
  }

  // Rule 1. The ungated pair has to look like a beacon: one loader, one
  // config call, the same id in both.
  if (ungatedLoaders.length > 1) {
    found.push(`carries ${ungatedLoaders.length} analytics snippets - a page view would be counted twice`);
  }
  for (const loader of loaders) {
    const id = loader[1];
    if (!/^G-[A-Za-z0-9]{4,20}$/.test(id)) {
      found.push(`the analytics snippet carries "${id}", which is not a GA4 measurement id`);
    }
  }
  for (const config of configs) {
    if (!loaders.some((loader) => loader[1] === config[1])) {
      found.push(`gtag('config', "${config[1]}") does not match any snippet on the page`);
    }
  }
  if (ungatedLoaders.length === 1 && ungatedConfigs.length === 0) {
    found.push("the analytics snippet has no gtag('config') call - the loader would report nothing");
  }
  if (ungatedLoaders.length === 1 && ungatedConfigs.length > 1) {
    found.push(`has ${ungatedConfigs.length} gtag('config') calls for ${ungatedLoaders.length} snippet(s)`);
  }

  return { problems: found, loaders: mentions.length };
}

/**
 * Rules 3, 5 and 6 for the SPA bundle.
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

  const ungated = `<html><head>
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-52MH8KHF9T"></script>
    <script>gtag('config', 'G-52MH8KHF9T');</script>
  </head></html>`;
  expect(
    "an ungated loader in the static HTML must be reported",
    checkPageAnalytics(ungated).problems.length > 0,
    "the loader was accepted",
  );

  const gated = `<html><head>
    <script id="${CONSENT_GATE_ID}">
      if (JSON.parse(localStorage.getItem('cookie_preferences_v1')||'{}').analytics) {
        var s = document.createElement('script');
        s.src = 'https://www.googletagmanager.com/gtag/js?id=G-52MH8KHF9T';
        document.head.appendChild(s);
      }
    </script>
  </head></html>`;
  expect(
    "a consent-gated loader must be accepted",
    checkPageAnalytics(gated).problems.length === 0,
    JSON.stringify(checkPageAnalytics(gated).problems),
  );

  const gatedButBlind = gated.replace("cookie_preferences_v1", "something_else");
  expect(
    "a gate that does not read the consent state must be reported",
    checkPageAnalytics(gatedButBlind).problems.length > 0,
  );

  const twoLoaders = `<html><head>
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-52MH8KHF9T"></script>
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-DT1W48PVTR"></script>
  </head></html>`;
  expect(
    "two loaders in one page must be reported",
    checkPageAnalytics(twoLoaders).problems.length > 0,
  );

  const mismatchedConfig = `<html><head>
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-52MH8KHF9T"></script>
    <script>gtag('config', 'G-DT1W48PVTR');</script>
  </head></html>`;
  expect(
    "a snippet that configures a different id must be reported",
    checkPageAnalytics(mismatchedConfig).problems.length > 0,
  );

  const configlessSnippet = `<html><head>
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-52MH8KHF9T"></script>
  </head></html>`;
  expect(
    "a snippet with no gtag('config') call must be reported",
    checkPageAnalytics(configlessSnippet).problems.length > 0,
  );

  const cleanBundle = 'googletagmanager.com/gtag/js cookie_preferences_v1 cookie_consent_v1 sponsored nofollow';
  expect(
    "a bundle without a pinned measurement id must pass",
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
let gatedAnalytics = 0;
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
  if (page.loaders > 0) {
    staticLoaders += page.loaders;
    if (page.problems.length === 0) gatedAnalytics += 1;
  }
  if ([...html.matchAll(GA_LOADER)].length === 1) withAnalytics += 1;

  // 2. the affiliate links
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

// 3. the SPA must declare the paid-link rel too, so the hydrated page agrees
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
      pagesWithConsentGatedAnalytics: gatedAnalytics,
      staticAnalyticsLoaders: staticLoaders,
      pagesWithAffiliate: withAffiliate,
      affiliateLinks,
      state:
        staticLoaders === 0
          ? "the static HTML ships no analytics script - GA4 is loaded by the SPA after consent"
          : "the static HTML carries a consent-gated analytics snippet",
      problems,
    },
    null,
    2,
  ),
);
process.exit(ok ? 0 : 1);
