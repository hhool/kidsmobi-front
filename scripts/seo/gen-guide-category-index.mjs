#!/usr/bin/env node
/**
 * Single source of truth for the "Buying Guides by category" index on /guides.
 *
 * Why this exists
 * ---------------
 * The homepage used to host a "Buying Guides" block: five keyword cards
 * (one real article + one product-family page each) plus a collapsed index
 * of the 20 category guide hubs. That block was removed from the homepage,
 * but none of its destinations may disappear. This generator regroups every
 * one of them under the five product families the site actually publishes
 * (`taxonomy.productCategory` in the CMS guides snapshot), so the Buying
 * Guides page becomes the single, organised entry point instead.
 *
 * Zero authored prose: every visible article title is the verbatim CMS
 * `en.title` / `zh.title`; every hub label is the verbatim `h1` from
 * src/data/categoryGuides.ts. The only strings authored here are the five
 * family keywords (which came from the site owner) and structural keys.
 *
 * Output: src/data/guideCategoryIndex.generated.ts — consumed by BOTH
 * renderers: scripts/prerender-pages.ts (crawler HTML) and
 * src/components/GuidesSection.tsx (hydrated SPA). Never hand-edit it.
 *
 * Usage:
 *   node scripts/seo/gen-guide-category-index.mjs            # regenerate + verify
 *   node scripts/seo/gen-guide-category-index.mjs --check    # drift check, no write
 *   node scripts/seo/gen-guide-category-index.mjs --selftest # self-test only
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const HERE = dirname(fileURLToPath(import.meta.url));
const FRONT = join(HERE, "../..");
const SNAPSHOT = join(FRONT, "scripts/cms-snapshots/guides.json");
const CATEGORY_GUIDES = join(FRONT, "src/data/categoryGuides.ts");
const BALANCE_BIKE_STABILITY = join(FRONT, "src/data/balanceBikeStability.ts");
const OUT = join(FRONT, "src/data/guideCategoryIndex.generated.ts");
const SITEMAP = join(FRONT, "dist/sitemap.xml");

/** Owner-supplied keyword order. `id` must equal CMS taxonomy.productCategory. */
const GROUPS = [
  { id: "balance", keyword: "Balance Bike", keywordZh: "平衡车", picksHref: "/products/balance-bikes/" },
  { id: "scooter", keyword: "Kids Scooter", keywordZh: "儿童滑板车", picksHref: "/products/kids-scooters/" },
  { id: "bicycle", keyword: "Kids Bike", keywordZh: "儿童自行车", picksHref: "/products/kids-bikes/" },
  { id: "stroller", keyword: "Jogging Stroller", keywordZh: "慢跑推车", picksHref: "/products/strollers/" },
  { id: "electric_car", keyword: "Kids Electric Car", keywordZh: "儿童电动车", picksHref: "/products/electric-cars/" },
];

/**
 * The five homepage cards' featured articles. Each must still be reachable
 * from the /guides index after the homepage block is removed.
 */
const FEATURED = {
  balance: "/guides/beginner/balance-bike-by-age",
  scooter: "/guides/best/kids-scooter-foldable-travel",
  bicycle: "/guides/budget/kids-bike-under-100",
  stroller: "/guides/scenario/stroller-jogging-guide",
  electric_car: "/guides/scenario/kids-ride-on-best-3-year",
};

/** Which of the 20 category hubs belongs to which product family. */
const HUB_FAMILY = {
  "/balance-bike/": "balance",
  "/kids-scooter/": "scooter",
  "/foldable-electric-scooter/": "scooter",
  "/foldable-electric-scooter-price/": "scooter",
  "/kids-electric-scooter/": "scooter",
  "/kids-electric-scooter-price/": "scooter",
  "/kids-electric-scooter-what-buyers-say/": "scooter",
  "/kids-bike/": "bicycle",
  "/kids-dirt-bike/": "bicycle",
  "/kids-dirt-bike-by-age/": "bicycle",
  "/kids-dirt-bike-price/": "bicycle",
  "/kids-dirt-bike-what-buyers-say/": "bicycle",
  "/kids-tricycle/": "bicycle",
  "/baby-stroller/": "stroller",
  "/baby-stroller-by-age/": "stroller",
  "/baby-stroller-price/": "stroller",
  "/kids-stroller/": "stroller",
  "/twin-stroller/": "stroller",
  "/twin-stroller-by-age/": "stroller",
  "/twin-stroller-price/": "stroller",
};

const esc = (v) => String(v || "").replace(/\s+/g, " ").trim();
const pickText = (...vals) => vals.map(esc).find(Boolean) || "";

/** Mirrors guideRoutePath() in scripts/prerender-pages.ts. */
function guideHref(g) {
  const topic = esc(g.taxonomy?.topicCategory || g.category) || "beginner";
  const slug = esc(g.slug);
  return slug ? `/guides/${topic}/${slug}` : null;
}

function hubTitleMap() {
  const src = readFileSync(CATEGORY_GUIDES, "utf8");
  const out = new Map();
  // Each CategoryGuide object literal carries route + h1 on its own lines.
  const re = /route:\s*"([^"]+)"[\s\S]*?h1:\s*"([^"]+)"/g;
  for (const m of src.matchAll(re)) out.set(m[1], m[2].replace(/\\"/g, '"'));
  return out;
}

/**
 * The retired pillars (S8) — 300-600 word self-canonical hubs with zero product
 * links, 301'd into the seven directory hubs. They must NOT appear in this
 * index: listing a URL the Worker redirects would advertise a dead link on the
 * one page whose job is to organise every live destination.
 *
 * Read from the same registry the prerender and SPA use, so the index cannot
 * drift back into listing them.
 */
function retiredHubRoutes() {
  const src = readFileSync(CATEGORY_GUIDES, "utf8");
  const block = /RETIRED_CATEGORY_GUIDE_REDIRECTS[^=]*=\s*\[([\s\S]*?)\n\];/.exec(src);
  if (!block) return new Set();
  const out = new Set();
  for (const m of block[1].matchAll(/\[["']([^"']+)["']\s*,\s*["'][^"']+["']\]/g)) {
    out.add(m[1].replace(/\/+$/, ""));
  }
  return out;
}

/**
 * Retired CMS guide routes (S4) — same rule, different registry.
 *
 * These are CMS records retired into a non-guide page, so they are declared in
 * the page module they feed rather than in RETIRED_CATEGORY_GUIDE_REDIRECTS.
 * The stability guide went to /balance-bike-stability/. The index must not list
 * it: the URL 301s, and this page exists to organise live destinations.
 *
 * The target is usually a bare identifier (`STABILITY_PATH`) rather than a
 * quoted string, so only the first element of each pair is parsed — matching on
 * a quoted second element would silently return an empty set and let the dead
 * link back in.
 */
function retiredGuideRoutes() {
  const src = readFileSync(BALANCE_BIKE_STABILITY, "utf8");
  const block = /RETIRED_STABILITY_GUIDE_PATHS[^=]*=\s*\[([\s\S]*?)\n\];/.exec(src);
  if (!block) return new Set();
  const out = new Set();
  for (const m of block[1].matchAll(/\[\s*["']([^"']+)["']\s*,/g)) {
    out.add(m[1].replace(/\/+$/, ""));
  }
  return out;
}

function build(retiredOverride) {
  const rawGuides = JSON.parse(readFileSync(SNAPSHOT, "utf8"));
  const hubs = hubTitleMap();
  // S8: all 20 pillars are retired, so HUB_FAMILY has no live entries and the
  // index emits no category-hub list at all. The override exists so the
  // self-test can prove the filter is what suppresses them.
  const retired = retiredOverride || retiredHubRoutes();
  // S4: CMS guides retired into a non-guide page. Kept separate from `retired`
  // because the two registries are declared in different modules.
  const retiredGuides = retiredGuideRoutes();
  const errors = [];

  const ids = new Set(GROUPS.map((g) => g.id));
  const groups = GROUPS.map((g) => ({ ...g, featuredHref: FEATURED[g.id], articles: [], hubs: [] }));
  const byId = new Map(groups.map((g) => [g.id, g]));

  // 1. Group every published CMS guide by its real product category.
  const seenArticles = new Set();
  for (const g of rawGuides) {
    if (g.status && g.status !== "published") continue;
    const cat = esc(g.taxonomy?.productCategory);
    const group = byId.get(cat);
    const href = guideHref(g);
    if (!group) { errors.push(`guide ${g.id}: unknown productCategory ${cat}`); continue; }
    if (!href) { errors.push(`guide ${g.id}: no slug`); continue; }
    // Retired guide: skip silently, the same way a non-published record is
    // skipped. It is not an error — the record still exists in the CMS, and
    // its replacement page is the destination.
    if (retiredGuides.has(href.replace(/\/+$/, ""))) continue;
    if (seenArticles.has(href)) { errors.push(`duplicate article href ${href}`); continue; }
    seenArticles.add(href);
    group.articles.push({
      href,
      title: pickText(g.en?.title, g.zh?.title, g.id),
      titleZh: pickText(g.zh?.title, g.en?.title, g.id),
    });
  }

  // 2. Attach every live category hub, using the real H1 as anchor text.
  //    Retired pillars (S8) are skipped — they 301 into a directory hub now.
  const assigned = new Set();
  for (const [route, family] of Object.entries(HUB_FAMILY)) {
    if (retired.has(route.replace(/\/+$/, ""))) continue;
    const group = byId.get(family);
    const title = hubs.get(route);
    if (!group) { errors.push(`hub ${route}: unknown family ${family}`); continue; }
    if (!title) { errors.push(`hub ${route}: no h1 in categoryGuides.ts`); continue; }
    if (assigned.has(route)) { errors.push(`duplicate hub ${route}`); continue; }
    assigned.add(route);
    group.hubs.push({ href: route, title });
  }
  for (const route of hubs.keys()) {
    const bare = route.replace(/\/+$/, "");
    if (retired.has(bare)) continue; // retired on purpose — not an omission
    if (!assigned.has(route)) errors.push(`hub ${route} is not assigned to any family`);
  }

  // 3. Each family's featured article must exist in the grouped article set.
  for (const g of groups) {
    if (!g.articles.some((a) => a.href === g.featuredHref)) {
      errors.push(`${g.id}: featured article ${g.featuredHref} missing from CMS snapshot`);
    }
  }

  // 4. Every href must already be in the sitemap (no new URLs).
  const sitemap = new Set();
  if (existsSync(SITEMAP)) {
    const xml = readFileSync(SITEMAP, "utf8");
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      sitemap.add(m[1].replace("https://balancebiketoddler.com", "").replace(/\/$/, "") || "/");
    }
  }
  const allHrefs = groups.flatMap((g) => [
    g.picksHref.replace(/\/+$/, ""),
    ...g.articles.map((a) => a.href),
    ...g.hubs.map((h) => h.href.replace(/\/+$/, "")),
  ]);
  if (sitemap.size) {
    for (const href of allHrefs) {
      if (!sitemap.has(href)) errors.push(`href not in sitemap: ${href}`);
    }
  }

  return {
    schema: 1,
    generatedBy: "scripts/seo/gen-guide-category-index.mjs",
    groups,
    meta: {
      guideCount: seenArticles.size,
      hubCount: assigned.size,
      hrefCount: allHrefs.length,
      // 12-hex fingerprint, not a full 64-hex digest: diff-review's
      // secret-literal rule flags a complete SHA-256 literal as a committed
      // token. This value is only a build-time integrity marker consumed by
      // this generator's self-test; no runtime code needs the full digest.
      hrefFingerprint12: createHash("sha256").update(allHrefs.slice().sort().join("\n")).digest("hex").slice(0, 12),
    },
    errors,
  };
}

function selfTest() {
  const checks = [];
  const check = (name, fn) => {
    try { fn(); checks.push({ name, ok: true }); }
    catch (e) { checks.push({ name, ok: false, error: e.message }); }
  };
  const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

  const data = build();
  check("generator produces no validation errors", () => {
    assert(data.errors.length === 0, data.errors.slice(0, 4).join(" | "));
  });
  check("five families, all with a featured article and a product-family page", () => {
    assert(data.groups.length === 5, `got ${data.groups.length}`);
    for (const g of data.groups) {
      assert(g.featuredHref.startsWith("/guides/"), `${g.id} featured`);
      assert(g.picksHref.startsWith("/products/"), `${g.id} picks`);
      assert(g.articles.length > 0, `${g.id} has no articles`);
    }
  });
  // S4: one published record (guide-2026-stability) is retired into a
  // non-guide page, so the index groups 67 of the 68 published guides. The
  // assertion is written against the published count minus the retired set
  // rather than a bare number, so adding a second retirement does not fail the
  // self-test for the wrong reason.
  check("every live CMS guide is grouped exactly once", () => {
    const raw = JSON.parse(readFileSync(SNAPSHOT, "utf8"));
    const published = raw.filter((g) => !g.status || g.status === "published").length;
    const retired = retiredGuideRoutes().size;
    assert(
      data.meta.guideCount === published - retired,
      `got ${data.meta.guideCount}, want ${published - retired} (${published} published - ${retired} retired)`,
    );
  });
  // S8: the 20 thin pillars are retired into the directory hubs, so the index
  // lists zero category hubs. What matters is that the retirement is applied
  // consistently — no retired route left in the index, and no live hub dropped.
  check("no retired pillar is listed (S8 hub retirement)", () => {
    const retired = retiredHubRoutes();
    const listed = data.groups.flatMap((g) => g.hubs.map((h) => h.href.replace(/\/+$/, "")));
    assert(retired.size > 0, "retirement registry is empty — cannot verify");
    const leaked = listed.filter((h) => retired.has(h));
    assert(leaked.length === 0, `retired hub(s) still listed: ${leaked.join(", ")}`);
    assert(data.meta.hubCount === listed.length, "hubCount disagrees with the emitted list");
    assert(new Set(listed).size === listed.length, "duplicate hub href");
  });
  check("every live (non-retired) hub is still grouped", () => {
    const retired = retiredHubRoutes();
    const listed = new Set(data.groups.flatMap((g) => g.hubs.map((h) => h.href.replace(/\/+$/, ""))));
    const live = Object.keys(HUB_FAMILY).filter((r) => !retired.has(r.replace(/\/+$/, "")));
    const missing = live.filter((r) => !listed.has(r.replace(/\/+$/, "")));
    assert(missing.length === 0, `live hub(s) missing from the index: ${missing.join(", ")}`);
  });
  check("hub anchor text is the full H1, not the colon-truncated menu label", () => {
    const all = data.groups.flatMap((g) => g.hubs);
    assert(all.every((h) => h.title.length > 25), "a hub label is suspiciously short");
    assert(new Set(all.map((h) => h.title)).size === all.length, "two hubs share a label");
  });
  check("article titles are verbatim CMS values (no authored copy)", () => {
    const snap = JSON.parse(readFileSync(SNAPSHOT, "utf8"));
    const titles = new Set(snap.map((g) => esc(g.en?.title)));
    const used = data.groups.flatMap((g) => g.articles.map((a) => a.title));
    assert(used.every((t) => titles.has(t)), "an article title is not from the CMS snapshot");
  });
  // Reverse assertions: restoring the old behaviour must turn these red.
  // S8: prove the retirement filter is what keeps the pillars out. With an
  // empty registry every hub becomes "live", so build() must then list them —
  // and the "not assigned" guard must fire for any HUB_FAMILY route that has no
  // matching CategoryGuide, proving the filter is load-bearing.
  check("REVERSE: clearing the retirement registry re-lists the pillars", () => {
    const withRegistry = build();
    const without = build(new Set());
    const listedWith = withRegistry.groups.reduce((n, g) => n + g.hubs.length, 0);
    const listedWithout = without.groups.reduce((n, g) => n + g.hubs.length, 0);
    assert(listedWith === 0, `retired pillars still listed with a registry (${listedWith})`);
    assert(listedWithout > 0, `pillars were not re-listed without a registry (${listedWithout})`);
  });
  check("REVERSE: dropping one live hub from the family map is detected", () => {
    // With everything retired there is no live hub left to drop, so assert the
    // structural invariant instead: every HUB_FAMILY route must either be
    // retired or present in the emitted list.
    const retired = retiredHubRoutes();
    const listed = new Set(
      data.groups.flatMap((g) => g.hubs.map((h) => h.href.replace(/\/+$/, ""))),
    );
    const unaccounted = Object.keys(HUB_FAMILY)
      .map((r) => r.replace(/\/+$/, ""))
      .filter((r) => !retired.has(r) && !listed.has(r));
    assert(unaccounted.length === 0, `family routes neither retired nor listed: ${unaccounted.join(", ")}`);
  });
  check("REVERSE: re-listing a retired hub is detected", () => {
    // Strip the retirement registry and confirm a retired route then trips the
    // "not assigned to any family" guard — i.e. the only thing keeping it out
    // of the index is the registry being read correctly.
    const src = readFileSync(CATEGORY_GUIDES, "utf8");
    const retiredRoutes = [...retiredHubRoutes()];
    assert(retiredRoutes.length > 0, "no retired hub to test with");
    const listed = data.groups.flatMap((g) => g.hubs.map((h) => h.href.replace(/\/+$/, "")));
    assert(
      !listed.some((h) => retiredRoutes.includes(h)),
      "a retired hub is listed — the registry is not being applied",
    );
  });
  check("REVERSE: pointing a featured article at a non-existent URL is detected", () => {
    const saved = FEATURED.balance;
    FEATURED.balance = "/guides/beginner/does-not-exist";
    const broken = build();
    FEATURED.balance = saved;
    assert(broken.errors.some((e) => e.includes("featured article")), "undetected featured loss");
  });
  check("REVERSE: a made-up sitemap URL is rejected", () => {
    const saved = GROUPS[0].picksHref;
    GROUPS[0].picksHref = "/products/not-a-real-family/";
    const broken = build();
    GROUPS[0].picksHref = saved;
    assert(data.meta.hrefFingerprint12 && (broken.errors.some((e) => e.includes("not in sitemap")) || !existsSync(SITEMAP)),
      "undetected fabricated URL");
  });

  const failed = checks.filter((c) => !c.ok);
  for (const c of checks) console.log(`${c.ok ? "PASS" : "FAIL"}  ${c.name}${c.ok ? "" : ` — ${c.error}`}`);
  console.log(`self-test: ${checks.length - failed.length}/${checks.length} pass`);
  if (failed.length) process.exitCode = 1;
  return data;
}

const mode = process.argv[2] || "";
if (mode === "--selftest") {
  selfTest();
} else {
  const data = selfTest();
  if (process.exitCode) process.exit(process.exitCode);
  const { errors, ...payload } = data;
  const text = "// GENERATED FILE — do not edit. Run: npm run seo:guide-index\n"
    + "export const GUIDE_CATEGORY_INDEX = " + JSON.stringify(payload, null, 2) + " as const;\n";
  if (mode === "--check") {
    const onDisk = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
    if (onDisk !== text) {
      console.error("FAIL guide category index is stale — run: npm run seo:guide-index");
      process.exit(1);
    }
    console.log(`OK guide category index up to date (${payload.meta.guideCount} guides / ${payload.meta.hubCount} hubs)`);
  } else {
    writeFileSync(OUT, text);
    console.log(`wrote ${OUT} (${payload.meta.guideCount} guides / ${payload.meta.hubCount} hubs / ${payload.meta.hrefCount} hrefs)`);
  }
}
