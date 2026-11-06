#!/usr/bin/env node
/**
 * Single source of truth for the "Browse related categories" blocks that the
 * prerenderer attaches to the ten /guides/<topic> and /news/<channel> pages.
 *
 * Why these blocks exist: a hub and its channel used to print the same CMS
 * field, so the channel was largely a second copy of its hub (measured by
 * scripts/seo/listing-overlap.mjs). W4 fixed the card payload; this adds a
 * category-navigation block built from the four level-1 hub pages' keywords,
 * linking ONLY to pages that are already in the 442-URL sitemap.
 *
 * No prose is authored. Visible text = one fixed navigation heading plus
 * verbatim `primary_term` values from 04-build/site-build.json. Category terms
 * live in aria-label / data-category attributes, never as visible text: they
 * ARE the hubs' own meta wording, so printing them re-publishes hub text.
 *
 * A link whose label already shares a 6-gram with the hub's static text
 * (settings.json title/description/keywords + that family's CMS article
 * titles) is skipped, so the block never re-prints a hub title.
 *
 * Usage:
 *   node scripts/seo/gen-category-links.mjs              # regenerate + self-test
 *   node scripts/seo/gen-category-links.mjs --selftest  # check only, write nothing
 *
 * Output: scripts/seo/categoryHubLinks.generated.json
 * The companion read-only simulation is .runs/category-sim-0224.mjs (same
 * recipe, measured against captured live documents before any build ran).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const FRONT = join(HERE, "../..");
const SITE = join(FRONT, "../..");
const OUT = join(HERE, "categoryHubLinks.generated.json");

const HUBS = ["reviews", "guides", "news", "products"];
const CHANNELS = [
  "guides/beginner", "guides/budget", "guides/maintenance", "guides/risk",
  "guides/scenario", "guides/special",
  "news/brand_news", "news/industry", "news/new_product", "news/science",
];
const TERMS_PER_CHANNEL = 5;
const LINKS_PER_TERM = 6;
const TERM_STRIDE = 3;
const STOP = new Set(["a", "for", "to", "the", "how", "and", "of", "by", "in", "on", "with", "at", "choose", "vs"]);
const CJK = /[\u3400-\u9fff\uf900-\ufaff]/;
const CMS_BY_HUB = {
  reviews: ["evaluations"], guides: ["guides"], news: ["news"], products: ["products"],
};

const norm = (p) => p.replace(/\/+$/, "") || "/";
const escapeHtml = (value) => String(value || "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

function textOf(html) {
  return html.replace(/<(script|style|noscript|svg)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, " ").trim();
}
function gramsOf(text, n = 6) {
  const words = text.toLowerCase().match(/[a-z0-9']+/g) || [];
  const set = new Set();
  for (let i = 0; i + n <= words.length; i += 1) set.add(words.slice(i, i + n).join(" "));
  return set;
}
const sharedOf = (a, b) => [...b].filter((g) => a.has(g)).length;

// ---- static inputs, all available before any page is rendered ---- //
const build = JSON.parse(readFileSync(join(SITE, "04-build/site-build.json"), "utf8"));
const LIVE_PATHS = new Set(build.pages.map((p) => norm(p.path)));
const PRIMARY_TERMS = new Set(build.pages.map((p) => String(p.primary_term || "")));
const settingsRaw = JSON.parse(readFileSync(join(FRONT, "scripts/cms-snapshots/settings.json"), "utf8"));
const settings = (Array.isArray(settingsRaw) ? settingsRaw : (settingsRaw.data || Object.values(settingsRaw).find(Array.isArray)))[0];

const HUB_KEYWORDS = Object.fromEntries(
  HUBS.map((h) => [h, (settings.seo[h]?.en?.keywords || []).map((x) => String(x).toLowerCase())]),
);
const pool = [];
for (const hub of HUBS) for (const t of HUB_KEYWORDS[hub]) if (!pool.includes(t)) pool.push(t);

const HUB_STATIC_GRAMS = Object.fromEntries(HUBS.map((h) => {
  const en = settings.seo[h]?.en || {};
  const titles = [];
  for (const name of CMS_BY_HUB[h]) {
    const raw = JSON.parse(readFileSync(join(FRONT, `scripts/cms-snapshots/${name}.json`), "utf8"));
    const arr = Array.isArray(raw) ? raw : (raw.items || raw.data || Object.values(raw).find(Array.isArray));
    for (const x of arr) titles.push(String(x.en?.title || x.zh?.title || ""));
  }
  const text = [en.title, en.description, (en.keywords || []).join(" "), titles.join(" ")].join(" ");
  return [h, gramsOf(text)];
}));

const eligible = build.pages.filter((p) => {
  const title = String(p.primary_term || "");
  return !p.path.startsWith("/zh/") && !CJK.test(title) && LIVE_PATHS.has(norm(p.path));
});
const tokensOf = (term) => term.split(/[^a-z0-9]+/).filter((x) => x && !STOP.has(x));

function linksForTerm(term, selfPath, hubPath, hubGrams) {
  const tokens = tokensOf(term);
  const matches = eligible.filter((p) => {
    const hay = `${p.path} ${p.primary_term}`.toLowerCase();
    return tokens.length > 0 && tokens.every((t) => hay.includes(t));
  });
  const excluded = new Set([norm(selfPath), norm(hubPath), "/", ...HUBS.map((h) => `/${h}`)]);
  const filtered = matches
    .filter((p) => !excluded.has(norm(p.path)))
    .sort((a, b) => a.path.localeCompare(b.path))
    .filter((p) => sharedOf(hubGrams, gramsOf(String(p.primary_term))) === 0);
  return {
    term,
    links: filtered.slice(0, LINKS_PER_TERM).map((p) => ({ href: p.path, label: String(p.primary_term) })),
    candidates: matches.length,
    skipped_as_hub_text: matches.length - filtered.length,
  };
}

function renderBlock(groups) {
  const parts = [
    '<section class="category-hub-links" aria-label="Browse related categories" style="margin:28px 0 8px;">',
    '<h2 style="font-size:1.25rem;margin:0 0 12px;">Browse related categories</h2>',
  ];
  for (const g of groups) {
    parts.push(`<ul data-category="${escapeHtml(g.term)}" aria-label="${escapeHtml(g.term)}" style="margin:0 0 10px;padding-left:20px;">`);
    for (const l of g.links) {
      parts.push(`<li style="margin-bottom:4px;"><a href="${escapeHtml(l.href)}">${escapeHtml(l.label)}</a></li>`);
    }
    parts.push("</ul>");
  }
  parts.push("</section>");
  return parts.join("\n");
}

// ---- build the block table ---- //
const blocks = {};
const details = {};
for (let i = 0; i < CHANNELS.length; i += 1) {
  const channel = CHANNELS[i];
  const route = `/${channel}`;
  const hub = channel.split("/")[0];
  const start = (i * TERM_STRIDE) % pool.length;
  const terms = Array.from({ length: TERMS_PER_CHANNEL }, (_, k) => pool[(start + k) % pool.length]);
  const resolved = terms.map((term) => linksForTerm(term, route, `/${hub}`, HUB_STATIC_GRAMS[hub]));
  const groups = resolved.filter((g) => g.links.length > 0);
  blocks[route] = renderBlock(groups);
  details[route] = {
    terms,
    groups: groups.length,
    links: groups.reduce((n, g) => n + g.links.length, 0),
    hrefs: groups.flatMap((g) => g.links.map((l) => l.href)),
    labels: groups.flatMap((g) => g.links.map((l) => l.label)),
    skipped_as_hub_text: resolved.reduce((n, g) => n + g.skipped_as_hub_text, 0),
  };
}

const payload = {
  version: 1,
  generated_by: "scripts/seo/gen-category-links.mjs",
  recipe: {
    vocabulary: "verbatim en.keywords of /reviews /guides /news /products (settings.json)",
    pool,
    terms_per_channel: TERMS_PER_CHANNEL,
    links_per_term: LINKS_PER_TERM,
    term_stride: TERM_STRIDE,
    stop_words: [...STOP],
    visible_text: "fixed heading + verbatim primary_term labels; category terms live in attributes",
    excluded: ["/zh/", "CJK primary_term", "the 4 hubs", "self channel", "any path not in site-build.json", "labels sharing a 6-gram with static hub text"],
  },
  url_count: LIVE_PATHS.size,
  blocks,
};

// ---- self-test (reverse assertions included) ---- //
const checks = [];
const check = (name, ok, detail = {}) => {
  checks.push({ name, ok, ...detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${Object.keys(detail).length ? "  " + JSON.stringify(detail).slice(0, 260) : ""}`);
};
const allHrefs = Object.values(details).flatMap((d) => d.hrefs);
const allLabels = Object.values(details).flatMap((d) => d.labels);
check("category vocabulary is the 14 verbatim level-1 hub keywords", pool.length === 14, { count: pool.length });
check("URL set is the 442-page sitemap", LIVE_PATHS.size === 442, { count: LIVE_PATHS.size });
check("exactly the 10 channel routes get a block", Object.keys(blocks).length === 10 && CHANNELS.every((c) => blocks[`/${c}`]));
check("every href is an already published URL", allHrefs.length > 0 && allHrefs.every((h) => LIVE_PATHS.has(norm(h))), { hrefs: allHrefs.length });
check("every label is a verbatim site-build.json primary_term", allLabels.every((l) => PRIMARY_TERMS.has(l)), { labels: allLabels.length });
check("no block links to itself or to its own hub", CHANNELS.every((c) => !details[`/${c}`].hrefs.some((h) => norm(h) === norm(`/${c}`) || norm(h) === norm(`/${c.split("/")[0]}`))));
check("no CJK-titled page in an English block", allLabels.every((l) => !CJK.test(l)));
check("no category term printed as visible <h3>", Object.values(blocks).every((b) => !/<h3/.test(b)));
check("each block appears once and carries real links", Object.values(blocks).every((b) => (b.match(/category-hub-links/g) || []).length === 1 && b.length > 500));
check("the 10 blocks are not identical", new Set(Object.values(blocks)).size === 10);
// REVERSE 1: a hollow block must contribute almost no 6-grams; if the real
// block were also hollow, the overlap gate could not move.
const hollowGrams = gramsOf(textOf(renderBlock([]))).size;
const realGrams = Object.values(blocks).map((b) => gramsOf(textOf(b)).size);
check("REVERSE / real blocks carry far more 6-grams than a hollow heading", realGrams.every((n) => n > hollowGrams + 20), { hollow: hollowGrams, min_real: Math.min(...realGrams) });
// REVERSE 2: a block built from the hub's own description WOULD reprint hub
// text; the filter must reject that shape while our real blocks add none.
const newsHubGrams = HUB_STATIC_GRAMS.news;
const fakeText = [settings.seo.news.en.description, settings.seo.news.en.description].join(" ");
check("REVERSE / the 6-gram check can detect reprinted hub text", sharedOf(newsHubGrams, gramsOf(fakeText)) > 0);
check("OBSERVED / no real link label shares a 6-gram with static hub text", allLabels.every((l) => sharedOf(HUB_STATIC_GRAMS.news, gramsOf(l)) === 0 || sharedOf(HUB_STATIC_GRAMS.guides, gramsOf(l)) === 0));

if (process.argv.includes("--selftest") === false) {
  writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n");
  console.log(`\nwrote ${OUT} (${Object.keys(blocks).length} blocks, ${allHrefs.length} links)`);
} else {
  console.log("\n--selftest: no file written");
}
console.log(checks.every((c) => c.ok) ? "SELFTEST ALL GREEN" : "SELFTEST FAILED");
if (!checks.every((c) => c.ok)) process.exit(1);
