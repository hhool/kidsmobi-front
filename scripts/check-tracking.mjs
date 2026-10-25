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
 *   1. a page carries AT MOST ONE analytics snippet - the static HTML already
 *      has it, and the SPA injects one after hydration, so a second copy in
 *      the static HTML would double-count every page view;
 *   2. an analytics snippet carries a real measurement id;
 *   3. an outbound affiliate link carries a real ASIN and a tracking tag, and
 *      declares itself as paid ("sponsored nofollow") - a paid link that
 *      does not say so is a link the search engines treat as organic;
 *   4. the SPA bundle still declares the paid-link rel, so the hydrated page
 *      agrees with the static one.
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
const AFFILIATE = /https:\/\/www\.amazon\.com\/dp\/([A-Z0-9]{10})\?tag=([A-Za-z0-9-]+)/g;

let pages = 0;
let withAnalytics = 0;
let withAffiliate = 0;
let affiliateLinks = 0;

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

  // 1 + 2. the analytics snippet
  const loaders = [...html.matchAll(GA_LOADER)];
  if (loaders.length > 1) {
    fail(rel, `carries ${loaders.length} analytics snippets - a page view would be counted twice`);
  }
  if (loaders.length === 1) {
    withAnalytics += 1;
    const id = loaders[0][1];
    if (!/^G-[A-Za-z0-9]{4,20}$/.test(id)) {
      fail(rel, `the analytics snippet carries "${id}", which is not a GA4 measurement id`);
    }
    const configs = [...html.matchAll(GA_CONFIG)];
    if (configs.length !== 1) {
      fail(rel, `has ${configs.length} gtag('config') calls for ${loaders.length} snippet(s)`);
    } else if (configs[0][1] !== id) {
      fail(rel, `the snippet loads id "${id}" but configures "${configs[0][1]}"`);
    }
  }

  // 3. the affiliate links
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

// 4. the SPA must declare the paid-link rel too, so the hydrated page agrees
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
    if (!code.includes("sponsored nofollow")) {
      fail("spa", "the SPA bundle no longer declares rel=\"sponsored nofollow\" on the affiliate link");
    }
    if (!code.includes("googletagmanager.com/gtag/js")) {
      fail("spa", "the SPA bundle no longer contains the analytics snippet");
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
      pagesWithAffiliate: withAffiliate,
      affiliateLinks,
      state: withAnalytics ? "tracking is configured" : "tracking is not configured (no snippets shipped)",
      problems,
    },
    null,
    2,
  ),
);
process.exit(ok ? 0 : 1);
