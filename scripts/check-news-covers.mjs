#!/usr/bin/env node
/**
 * Every news article must ship with a visible cover image.
 *
 * The /news hub listed nine stories whose static cards were plain text, and
 * five of those stories had no imageUrl at all: the og:image tag was simply
 * absent and nothing above the fold showed a picture. Nothing caught it
 * because no guard looked at news images — the section-level checks only ever
 * asserted titles, descriptions and keywords.
 *
 * This guard reads the built dist/ only. It deliberately does NOT ask the same
 * resolver that produced the markup what the markup should say (that blind spot
 * has shipped three regressions already); it asserts observable facts:
 *
 *   1. each article page has a single absolute og:image;
 *   2. the page body carries a visible <img> with that same src, so a reader —
 *      and a crawler that renders — sees the cover the social card promises;
 *   3. when the cover is same-origin, the file it points at exists in dist and
 *      is a real image, not a 404 waiting to happen (the store-origin rewrites
 *      this replaces produced exactly that);
 *   4. the hub renders one card thumbnail per listed story.
 *
 * Run: npm run check:newscovers   (after `npm run build`)
 */
import { readFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const DIST = resolve(process.env.CHECK_NEWS_COVERS_ROOT || "dist");
const SITE_BASE = (process.env.SEO_SITE_BASE_URL || "https://balancebiketoddler.com").replace(/\/+$/, "");
const MIN_BYTES = 5_000;
const MAX_BYTES = 400_000;

const problems = [];
const fail = (where, msg) => problems.push(`${where} — ${msg}`);

function read(rel) {
  return readFileSync(join(DIST, rel), "utf8");
}

if (!existsSync(join(DIST, "news"))) {
  console.error(JSON.stringify({ ok: false, failed: ["dist/news missing — run npm run build first"] }, null, 2));
  process.exit(1);
}

// Article pages live at news/<channel>/<slug>.html; channel indexes sit at
// news/<channel>.html and carry no article cover of their own.
const channels = readdirSync(join(DIST, "news"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const articles = [];
for (const channel of channels) {
  for (const file of readdirSync(join(DIST, "news", channel))) {
    if (!file.endsWith(".html")) continue;
    articles.push({
      route: `/news/${channel}/${file.replace(/\.html$/, "")}`,
      rel: `news/${channel}/${file}`,
    });
  }
}

if (articles.length === 0) fail("dist/news", "no article pages found — prerender produced nothing");

const coverSeen = new Map();

for (const article of articles) {
  const html = read(article.rel);
  const og = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
  if (!og) {
    fail(article.route, "no og:image — the story has no cover");
    continue;
  }
  const cover = og[1].trim();
  if (!/^https:\/\//i.test(cover)) {
    fail(article.route, `og:image is not absolute: ${cover}`);
    continue;
  }

  // 2. a visible <img> with the same src
  const heroRe = new RegExp(`<img[^>]+src="${cover.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`, "i");
  if (!heroRe.test(html)) {
    fail(article.route, `page body has no <img> for its og:image (${cover})`);
  }

  // 3. same-origin covers must resolve to a real file in this build
  if (cover.startsWith(`${SITE_BASE}/`)) {
    const relPath = decodeURIComponent(cover.slice(SITE_BASE.length + 1).split(/[?#]/)[0]);
    const abs = join(DIST, relPath);
    if (!existsSync(abs)) {
      fail(article.route, `cover points at a file that was never shipped: /${relPath}`);
      continue;
    }
    const { size } = statSync(abs);
    if (size < MIN_BYTES) fail(article.route, `cover file is suspiciously small (${size} bytes): /${relPath}`);
    if (size > MAX_BYTES) fail(article.route, `cover file is too heavy (${Math.round(size / 1024)} KB): /${relPath}`);
  }

  coverSeen.set(cover, (coverSeen.get(cover) || 0) + 1);
}

// 4. the hub must render a thumbnail per story
if (existsSync(join(DIST, "news.html"))) {
  const hub = read("news.html");
  const cardImgs = (hub.match(/<img\s[^>]*src="[^"]+\.(?:webp|jpe?g|png|avif)"/gi) || []).length;
  if (cardImgs < articles.length) {
    fail("/news", `hub renders ${cardImgs} card image(s) for ${articles.length} article(s) — cards are falling back to text`);
  }
} else {
  fail("/news", "dist/news.html missing");
}

const ok = problems.length === 0;
console.log(
  JSON.stringify(
    {
      ok,
      articlesChecked: articles.length,
      distinctCovers: coverSeen.size,
      reusedCovers: [...coverSeen.entries()].filter(([, n]) => n > 1).map(([src, n]) => `${src} x${n}`),
    },
    null,
    2,
  ),
);

if (!ok) {
  console.error("check:newscovers FAILED");
  for (const problem of problems) console.error("  - " + problem);
  process.exit(1);
}
