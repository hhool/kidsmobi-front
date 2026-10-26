#!/usr/bin/env node
/**
 * The cover in an article body must be centred, uncropped, and must be the
 * ORIGINAL artwork.
 *
 * Three rules, two renderers. The prerendered static HTML is what a crawler
 * reads; the hydrated SPA is what a reader sees. The moment the two
 * disagree, one of the two audiences gets the wrong hero.
 *
 *   1. centred: the hero viewport carries auto inline margins, so the
 *      browser centres it in the article column (the old bug: a 384px cover
 *      pinned to the left margin with 335px of empty space beside it);
 *   2. uncropped: the hero <img> is object-fit: contain, so whatever aspect
 *      ratio the original has, the whole picture stays in the frame;
 *   3. original: the hero must not reference a retired 800x800 composite
 *      (scripts/publish-article-covers.py padded 53 of the 65 non-square
 *      sources with a blurred mirror of their own edge - that processing is
 *      gone; covers point straight at the source artwork now).
 *
 * What this guard reads, all from the built dist/:
 *   1. every article detail page that carries a hero (class="article-hero")
 *      must give that viewport auto inline margins and contain an
 *      object-fit: contain <img> whose src is not a retired composite;
 *   2. the SPA bundle must carry the viewport classes on both the guide hero
 *      and the news figure.
 *
 * Run: npm run check:heroalign   (after `npm run build`)
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const DIST = resolve(process.env.CHECK_HERO_ALIGN_ROOT || "dist");
const ASSETS = join(DIST, "assets");

const problems = [];
const fail = (where, msg) => problems.push(`${where} — ${msg}`);

if (!existsSync(DIST)) {
  console.error(JSON.stringify({ ok: false, failed: ["dist missing — run npm run build first"] }, null, 2));
  process.exit(1);
}

// ---- 1. the prerendered static HTML ----
// The ARTICLE HERO is the element carrying class="article-hero" (the
// fixed-height white viewport around the cover). Listing-card thumbnails use
// the same artwork but a different class and sit in a compact side frame on
// purpose - they are not what this guard is about.
const HERO_DIV = /<([a-z]+)[^>]*class="article-hero"[^>]*>/gi;
const RETIRED_COMPOSITE = /-800x800\.webp(?:[?#]|$)/i;

const ARTICLE_DIRS = ["guides", "news", "zh/guides", "zh/news"];

// Detail pages sit two levels deep (guides/<topic>/<slug>.html); hub indexes
// sit one level deep and carry no hero of their own. Exactly one detail page
// is allowed to ship without a cover: the recall record is a static data page
// generated from src/data/kidsBikeRecalls.ts and has never had artwork.
const NO_COVER_ALLOWLIST = ["guides/risk/balance-bike-recall-record"];

let pagesWithHero = 0;
let pagesWithoutHero = 0;
let expectedNoCover = 0;
const silentNoCover = [];

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

for (const rel of ARTICLE_DIRS) {
  for (const file of walk(join(DIST, rel))) {
    const html = readFileSync(file, "utf8");
    const relPath = file.slice(DIST.length + 1).split("\\").join("/").replace(/\.html$/, "");
    const depth = relPath.split("/").length;
    HERO_DIV.lastIndex = 0;
    const heroes = [...html.matchAll(HERO_DIV)];
    if (!heroes.length) {
      pagesWithoutHero++;
      // A hub index legitimately has no hero; a DETAIL page losing its cover
      // is a silent regression (the article renders text-only) unless the
      // page is on the allowlist.
      if (depth > 2 && !NO_COVER_ALLOWLIST.includes(relPath)) {
        silentNoCover.push(relPath);
      } else if (depth > 2) {
        expectedNoCover++;
      }
      continue;
    }
    pagesWithHero++;
    for (const hero of heroes) {
      const tag = hero[0];
      const style = (tag.match(/style="([^"]*)"/) || [])[1] || "";
      if (!/margin-left:\s*auto/.test(style) || !/margin-right:\s*auto/.test(style)) {
        fail(
          relPath,
          "the article hero is not centred in the static HTML — the viewport needs " +
            "margin-left: auto and margin-right: auto",
        );
      }
      // The <img> inside the viewport: contain, and not a retired composite.
      const start = html.indexOf(tag);
      const after = html.slice(start + tag.length, start + tag.length + 600);
      const img = after.match(/<img[^>]*>/);
      if (!img) {
        fail(relPath, "the article hero viewport carries no <img>");
        continue;
      }
      if (!/object-fit:\s*contain/i.test(img[0])) {
        fail(relPath, "the article hero image is not object-fit: contain — an off-square original would be cropped");
      }
      const src = (img[0].match(/src="([^"]*)"/) || [])[1] || "";
      if (RETIRED_COMPOSITE.test(src)) {
        fail(relPath, `the article hero still points at a retired 800x800 composite: ${src}`);
      }
    }
  }
}

if (pagesWithHero === 0) {
  fail("dist", "no article page carries a hero — the prerender stopped emitting the article cover");
}

for (const relPath of silentNoCover) {
  fail(relPath, "article detail page carries no hero — its cover silently disappeared");
}

// ---- 2. the hydrated SPA ----
// The SPA frames the same cover with Tailwind classes. Both the guide hero
// and the news figure are checked, because they are two separate components.
function bundle(name) {
  if (!existsSync(ASSETS)) return null;
  const hit = readdirSync(ASSETS).find((f) => f.startsWith(name) && f.endsWith(".js"));
  return hit ? readFileSync(join(ASSETS, hit), "utf8") : null;
}

// The shared viewport string both components apply to the hero wrapper.
const VIEWPORT = "w-full max-w-[560px] h-[300px] sm:h-[400px] bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex items-center justify-center p-4 sm:p-8";
const CONTAIN = "max-w-full max-h-full object-contain";

const SPA_EXPECTATIONS = [
  {
    name: "GuidesSection",
    label: "guide body hero",
    pattern: new RegExp(`mx-auto ${VIEWPORT.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
    hint: "the guide hero needs the product-page viewport classes (mx-auto + fixed height + object-contain frame)",
  },
  {
    name: "NewsSection",
    label: "news body figure",
    pattern: new RegExp(`my-0 mx-auto ${VIEWPORT.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
    hint: "the news figure needs the same viewport classes (my-0 mx-auto, not m-0, so the inline margins are not reset)",
  },
  {
    name: "GuidesSection",
    label: "guide hero image",
    pattern: new RegExp(CONTAIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    hint: "the guide hero image needs object-contain (an off-square original must letterbox, never crop)",
  },
  {
    name: "NewsSection",
    label: "news hero image",
    pattern: new RegExp(CONTAIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    hint: "the news hero image needs object-contain",
  },
];

for (const { name, label, pattern, hint } of SPA_EXPECTATIONS) {
  const code = bundle(name);
  if (!code) {
    fail(`spa/${name}`, `bundle chunk ${name}-*.js not found in dist/assets`);
    continue;
  }
  if (!pattern.test(code)) {
    fail(`spa/${label}`, `not centred/framed in the SPA bundle — ${hint}`);
  }
}

const ok = problems.length === 0;
console.log(
  JSON.stringify(
    {
      ok,
      articlePagesWithHero: pagesWithHero,
      articlePagesWithoutHero: pagesWithoutHero,
      checked: ["static HTML", "SPA bundle"],
      rules: ["centred (auto inline margins)", "object-fit: contain", "original artwork (no retired composite)"],
      problems,
    },
    null,
    2,
  ),
);
process.exit(ok ? 0 : 1);
