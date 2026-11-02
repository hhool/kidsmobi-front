#!/usr/bin/env node
/**
 * BreadcrumbList has to exist where Google renders a trail, and it has to end
 * at the page itself.
 *
 * A 2026-10-25 audit reported the guides/reviews family as shipping "only
 * Organization + WebSite" JSON-LD. That was wrong for the detail pages (they
 * have Article/NewsArticle + BreadcrumbList) but right for the five section
 * hubs: /guides, /news, /reviews and their Chinese editions declared no
 * BreadcrumbList at all, so the one place a "Home > section" trail is most
 * obvious was the one place it was missing. The hub emitter was fixed the
 * same day; this guard keeps it fixed.
 *
 * The audit also showed how easy that gap is to miss: the JSON-LD on these
 * pages is an ARRAY of objects, so a checker that reads only a top-level
 * "@type" sees nothing and reports the page as bare. Every extraction here
 * unwraps arrays first.
 *
 * Checks (over the built dist/):
 *   1. every page in the guides / news / reviews families (English and
 *      Chinese, hubs + channels + details) declares a BreadcrumbList;
 *   2. every trail ends at the page it sits on, and the five hub trails start
 *      at the homepage (Home > section);
 *   3. any page declaring Article or NewsArticle also declares a
 *      BreadcrumbList (the pair travels together).
 *
 * Run: npm run check:jsonld   (after `npm run build`)
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const DIST = resolve(process.env.CHECK_JSONLD_ROOT || "dist");
const SITE = "https://balancebiketoddler.com";

const problems = [];
const fail = (where, msg) => problems.push(`${where} — ${msg}`);

if (!existsSync(DIST)) {
  console.error(JSON.stringify({ ok: false, failed: ["dist missing — run npm run build first"] }, null, 2));
  process.exit(1);
}

function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

/** Every JSON-LD object on the page. The payload is an array, so unwrap it. */
function jsonLdObjects(html) {
  const out = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let parsed;
    try {
      parsed = JSON.parse(m[1]);
    } catch {
      continue; // a malformed block is a different bug; not this guard's
    }
    for (const o of Array.isArray(parsed) ? parsed : [parsed]) {
      if (o && typeof o === "object") out.push(o);
    }
  }
  return out;
}

function breadcrumbOf(html) {
  return jsonLdObjects(html).find((o) => o["@type"] === "BreadcrumbList") || null;
}

const rel = (file) => file.slice(DIST.length + 1).split("\\").join("/");

/**
 * The five section hubs. `hubFile` sits next to the family directory
 * (dist/guides.html, not dist/guides/index.html), so it is checked apart from
 * the walk.
 */
const FAMILIES = [
  { dir: "guides", hubFile: "guides.html", url: `${SITE}/guides` },
  { dir: "news", hubFile: "news.html", url: `${SITE}/news` },
  { dir: "reviews", hubFile: "reviews.html", url: `${SITE}/reviews` },
  { dir: join("zh", "guides"), hubFile: join("zh", "guides.html"), url: `${SITE}/zh/guides` },
  { dir: join("zh", "news"), hubFile: join("zh", "news.html"), url: `${SITE}/zh/news` },
];

let pagesChecked = 0;

function checkTrail(file, pageUrl, { requireHomeStart = false } = {}) {
  const html = readFileSync(file, "utf8");
  const bc = breadcrumbOf(html);
  const where = rel(file);
  if (!bc) {
    fail(where, "no BreadcrumbList in the JSON-LD — the SERP trail comes from here");
    return;
  }
  const items = Array.isArray(bc.itemListElement) ? bc.itemListElement : [];
  if (items.length < 2) {
    fail(where, `BreadcrumbList carries ${items.length} item(s) — a trail needs at least two steps`);
    return;
  }
  // The trail has to end at the page it sits on, whatever shape it takes:
  // channel pages start at the homepage, article details start at their hub.
  const last = items[items.length - 1];
  if (String(last?.item || "") !== pageUrl) {
    fail(where, `the trail ends at "${last?.item}", expected the page itself "${pageUrl}"`);
  }
  if (requireHomeStart) {
    const first = items[0];
    if (String(first?.item || "") !== `${SITE}/`) {
      fail(where, `the hub trail starts at "${first?.item}", expected the homepage "${SITE}/"`);
    }
  }
}

for (const fam of FAMILIES) {
  for (const file of walk(join(DIST, fam.dir))) {
    pagesChecked += 1;
    // The page's own URL is whatever the trail should end at; derive it from
    // the canonical link rather than reimplementing the route table.
    const html = readFileSync(file, "utf8");
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
    checkTrail(file, canonical ? canonical[1] : fam.url);
  }
  const hubPath = join(DIST, fam.hubFile);
  if (!existsSync(hubPath)) {
    fail(fam.hubFile, "the hub page is missing from dist");
    continue;
  }
  pagesChecked += 1;
  checkTrail(hubPath, fam.url, { requireHomeStart: true });
}

// Article and its breadcrumb travel together: a detail page that loses one
// loses the trail in the SERP while still looking fine on the page itself.
for (const fam of FAMILIES) {
  for (const file of walk(join(DIST, fam.dir))) {
    const html = readFileSync(file, "utf8");
    const isArticle = jsonLdObjects(html).some(
      (o) => o["@type"] === "Article" || o["@type"] === "NewsArticle",
    );
    if (isArticle && !breadcrumbOf(html)) {
      fail(rel(file), "declares Article/NewsArticle but no BreadcrumbList");
    }
  }
}

// Organization.sameAs has to point at profiles, and every X reference has to
// use the ONE handle declared in src/lib/socialShare.ts. On 2026-11-03 the
// prerender copy-pasted the sameAs array into six renderers while the SPA read
// the constant, so the live HTML said BalanceBikeToddler and the hydrated page
// said bbtreviews — both valid URLs, so nothing failed loudly. This guard reads
// the built dist/ so it catches whichever side drifts next.
const xHandleMatch = readFileSync(resolve("src/lib/socialShare.ts"), "utf8").match(
  /OFFICIAL_X_HANDLE\s*=\s*"([^"]+)"/,
);
const officialX = xHandleMatch ? `https://x.com/${xHandleMatch[1]}` : null;
// A platform root is worse than no sameAs: it tells a crawler nothing and
// Google treats it as an unverified profile claim.
const BARE_PLATFORM_ROOTS = new Set([
  "https://www.facebook.com",
  "https://facebook.com",
  "https://www.instagram.com",
  "https://instagram.com",
  "https://x.com",
  "https://twitter.com",
  "https://www.youtube.com",
  "https://youtube.com",
  "https://www.tiktok.com",
]);

/** sameAs can hang off a nested publisher/author, so walk the whole tree. */
function collectSameAs(node, out = []) {
  if (!node || typeof node !== "object") return out;
  if (Array.isArray(node)) {
    for (const item of node) collectSameAs(item, out);
    return out;
  }
  if (Array.isArray(node.sameAs)) {
    for (const url of node.sameAs) if (typeof url === "string") out.push(url);
  }
  for (const value of Object.values(node)) {
    if (value && typeof value === "object") collectSameAs(value, out);
  }
  return out;
}

if (!officialX) {
  fail("src/lib/socialShare.ts", "cannot read OFFICIAL_X_HANDLE — the X handle guard is blind");
}

const sameAsSeen = new Set();
for (const file of walk(DIST)) {
  const where = rel(file);
  // Per page, deduped: the same Organization can appear standalone and again
  // as a nested publisher, and repeating one problem three times buries the
  // real count.
  for (const url of new Set(collectSameAs(jsonLdObjects(readFileSync(file, "utf8"))))) {
    sameAsSeen.add(url);
    const normalized = url.replace(/\/+$/, "");
    if (BARE_PLATFORM_ROOTS.has(normalized)) {
      fail(where, `sameAs points at the platform root "${url}" — name a real profile instead`);
    }
    if (officialX && /^https?:\/\/(www\.)?(x|twitter)\.com\//i.test(url) && normalized !== officialX) {
      fail(where, `sameAs says "${url}" but the official X handle is "${officialX}"`);
    }
  }
}

const ok = problems.length === 0;
console.log(
  JSON.stringify(
    {
      ok,
      pagesChecked,
      families: FAMILIES.map((f) => f.url),
      sameAs: [...sameAsSeen].sort(),
      officialX,
      problems,
    },
    null,
    2,
  ),
);
process.exit(ok ? 0 : 1);
