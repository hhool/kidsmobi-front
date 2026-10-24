#!/usr/bin/env node
/**
 * The cover in an article body must be centred in the article column.
 *
 * The body cover is capped at 384px inside a 768px column, so whether it
 * sits in the middle or hangs against the left margin is a one-line
 * difference - and a centred cover and a left-aligned one look equally
 * plausible in a diff. Two renderers have to agree: the prerendered static
 * HTML (what a crawler reads) and the hydrated SPA (what a reader sees).
 * The moment they disagree, one of the two audiences gets a cover pinned to
 * the left margin.
 *
 * What this guard reads, all from the built dist/:
 *   1. every article detail page that carries the article hero must give
 *      that hero auto inline margins, so the browser centres it;
 *   2. the SPA bundle must carry the centring class on both the guide hero
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
// The ARTICLE HERO is the cover <img> that points at a *-800x800.webp asset
// AND carries the hero's width cap (max-width: 384px). Listing-card
// thumbnails use the same artwork but a different style, and they sit in a
// grid on purpose - they are not what this guard is about.
const IMG_TAG = /<img[^>]*src="[^"]*-800x800\.webp"[^>]*>/g;
const ARTICLE_DIRS = ["guides", "news", "zh/guides", "zh/news"];

let pagesWithHero = 0;
let pagesWithoutHero = 0;

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
    const heroes = (html.match(IMG_TAG) || []).filter((img) => {
      const style = (img.match(/style="([^"]*)"/) || [])[1] || "";
      return /max-width:\s*384px/.test(style);
    });
    if (!heroes.length) {
      pagesWithoutHero++;
      continue;
    }
    pagesWithHero++;
    const relPath = file.slice(DIST.length + 1).split("\\").join("/");
    for (const img of heroes) {
      const style = (img.match(/style="([^"]*)"/) || [])[1] || "";
      if (!/margin-left:\s*auto/.test(style) || !/margin-right:\s*auto/.test(style)) {
        fail(
          relPath,
          "the article hero is not centred in the static HTML — the inline style needs " +
            "margin-left: auto and margin-right: auto",
        );
      }
    }
  }
}

if (pagesWithHero === 0) {
  fail("dist", "no article page carries a hero — the prerender stopped emitting the article cover");
}

// ---- 2. the hydrated SPA ----
// The SPA centres the same cover with a Tailwind class. Both the guide hero
// and the news figure are checked, because they are two separate components.
function bundle(name) {
  if (!existsSync(ASSETS)) return null;
  const hit = readdirSync(ASSETS).find((f) => f.startsWith(name) && f.endsWith(".js"));
  return hit ? readFileSync(join(ASSETS, hit), "utf8") : null;
}

const SPA_EXPECTATIONS = [
  {
    name: "GuidesSection",
    label: "guide body hero",
    pattern: /w-full max-w-sm mx-auto h-auto aspect-square/,
    hint: "the guide hero needs mx-auto (it is capped at max-w-sm)",
  },
  {
    name: "NewsSection",
    label: "news body figure",
    pattern: /my-0 mx-auto max-w-sm/,
    hint: "the news <figure> needs mx-auto (use my-0, not m-0, so the inline margins are not reset)",
  },
];

for (const { name, label, pattern, hint } of SPA_EXPECTATIONS) {
  const code = bundle(name);
  if (!code) {
    fail(`spa/${name}`, `bundle chunk ${name}-*.js not found in dist/assets`);
    continue;
  }
  if (!pattern.test(code)) {
    fail(`spa/${label}`, `not centred in the SPA bundle — ${hint}`);
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
      rule: "the body cover is centred in the article column, in both renderers",
      problems,
    },
    null,
    2,
  ),
);
process.exit(ok ? 0 : 1);
