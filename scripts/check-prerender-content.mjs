/**
 * Content floor for every prerendered page.
 *
 * Why this exists: an edit once dropped `${sectionsHtml}` from the transparency
 * prerender template. All seven trust pages kept their <head>, their canonical
 * and their JSON-LD — only the body vanished. `tsc`, `npm run build` and
 * `seo:check` all passed; nothing but eyeballing dist caught it. A page that
 * renders an empty <article> is worse than a missing page, and no automated
 * step in this repo was looking at the body at all.
 *
 * This guard reads dist/ only, so it must run after `npm run build`.
 *
 * npm run check:content
 */
import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, resolve } from "path";

// CHECK_CONTENT_ROOT points at another build tree so a known-bad dist can be
// replayed instead of rebuilt (used to prove this guard catches regressions).
const DIST = resolve(process.cwd(), process.env.CHECK_CONTENT_ROOT || "dist");
const SITE_BASE = (process.env.SEO_SITE_BASE_URL || "https://balancebiketoddler.com").replace(/\/+$/, "");

/** Pages that are legitimately not articles (a Cloudflare-style error page). */
const BODY_ALLOWLIST = new Set(["dist/404.html", "dist/index.html"]);

/** A page shorter than this cannot be answering anything. */
const MIN_TEXT_CHARS = 800;

/** Every real page carries at least one section heading below its <h1>; a
 *  single wall of paragraphs has no outline for a crawler to read. Any level
 *  counts — the CMS articles lean on h3 for their numbered sections. */
const MIN_SUBHEADINGS = 1;

/**
 * The reference pages that host the cluster block. These are fixed routes; what
 * the block LINKS to is configuration (settings.referenceCluster), so the
 * targets come from the manifest the prerender publishes next to the build.
 */
const REFERENCE_CLUSTER = [
  "/balance-bike-size-chart/",
  "/kids-bike-size-chart/",
  "/kids-bike-by-age/",
  "/balance-bike-by-age/",
  "/balance-bike-stability/",
  "/balance-bike-weight/",
  "/balance-bike-safety-standards/",
  "/guides/risk/balance-bike-recall-record",
  "/balance-bike-what-buyers-say/",
  "/balance-bike-budget/",
];

const CLUSTER_MANIFEST = join(DIST, "data", "reference-cluster.json");
const publishedCluster = existsSync(CLUSTER_MANIFEST)
  ? JSON.parse(readFileSync(CLUSTER_MANIFEST, "utf8"))
      .map((card) => (card && typeof card.href === "string" ? card.href : ""))
      .filter(Boolean)
  : [];
/** Built-in asset set is the fallback for a dist built before the manifest. */
const CLUSTER_TARGETS = publishedCluster.length ? publishedCluster : REFERENCE_CLUSTER;
const normPath = (value) => value.replace(/\/+$/, "") || "/";

const MIN_CLUSTER_LINKING_PAGES = 10;

// Not simply split("<footer"): page bodies legitimately contain their own
// <footer> (source notes on the reference pages), and cutting at the first one
// would drop the very links this check exists to protect.
const SITE_FOOTER = /<footer style="margin-top:34px[\s\S]*?<\/footer>/g;
const stripFooter = (html) => html.replace(/<script[\s\S]*?<\/script>/g, "").replace(SITE_FOOTER, "");

if (!existsSync(DIST)) {
  console.error(JSON.stringify({ ok: false, failed: [{ name: "dist-exists", detail: "run npm run build first" }] }, null, 2));
  process.exit(1);
}

function listHtml(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) listHtml(path, out);
    else if (entry.endsWith(".html")) out.push(path);
  }
  return out;
}

function visibleStats(file) {
  const raw = readFileSync(file, "utf8");
  const body = raw.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "");
  const text = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const canonical = (/<link\s+rel="canonical"\s+href="([^"]+)"/.exec(raw) || [])[1] || "";
  return { raw, text, canonical };
}

const files = listHtml(DIST);
const failures = [];
const warnings = [];
const pages = [];

for (const file of files) {
  const rel = `dist/${file.slice(DIST.length + 1)}`;
  if (BODY_ALLOWLIST.has(rel)) continue;
  const { raw, text, canonical } = visibleStats(file);
  const h1 = (raw.match(/<h1[\s>]/g) || []).length;
  const subheadings = (raw.match(/<h[2-4][\s>]/g) || []).length;
  pages.push({ file: rel, chars: text.length, h1, subheadings });

  if (text.length < MIN_TEXT_CHARS) {
    failures.push({ name: "page-body-thin", detail: `${rel} renders only ${text.length} visible characters (min ${MIN_TEXT_CHARS})` });
  }
  if (h1 !== 1) {
    failures.push({ name: "page-h1-count", detail: `${rel} has ${h1} <h1> elements (expected exactly 1)` });
  }
  if (subheadings < MIN_SUBHEADINGS) {
    failures.push({ name: "page-no-subheadings", detail: `${rel} has ${subheadings} section headings below its <h1> (min ${MIN_SUBHEADINGS})` });
  }
  if (canonical && !canonical.startsWith(SITE_BASE)) {
    failures.push({ name: "page-canonical-host", detail: `${rel} canonical points off-site: ${canonical}` });
  }

  // Repeated blocks read as templated filler. Three identical paragraphs on one
  // page is not editing, it is a rendering bug.
  const paragraphs = (raw.match(/<p\b[^>]*>[\s\S]*?<\/p>/g) || [])
    .map((p) => p.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
    .filter((p) => p.length >= 120);
  const counts = new Map();
  for (const p of paragraphs) counts.set(p, (counts.get(p) || 0) + 1);
  for (const [p, n] of counts) {
    if (n >= 3) {
      warnings.push({ file: rel, repeats: n, preview: p.slice(0, 90) });
    }
  }
}

// Membership check is pointless if dist is empty or half-built.
if (pages.length < 200) {
  failures.push({ name: "dist-page-count", detail: `only ${pages.length} prerendered pages found — build is incomplete` });
}

/**
 * Cluster integrity. The reference pages were built to answer the balance-bike
 * queries this domain actually receives; if they stop linking to each other, or
 * if nothing links into them, the cluster silently falls apart.
 */
function fileForPath(path) {
  const candidates = [join(DIST, path, "index.html"), join(DIST, `${path}.html`)];
  return candidates.find((candidate) => existsSync(candidate));
}

// Every cluster target must resolve — a card pointing at a page we do not
// render is a dead internal link, and the CMS can repoint these at will.
for (const target of CLUSTER_TARGETS) {
  if (!fileForPath(target)) {
    failures.push({ name: "cluster-target-missing", detail: `${target} is in the cluster but was not prerendered` });
  }
}

// Each host page must link to every target except itself (a card pointing at
// its own page is filtered out at render time, so seven links is the floor).
for (const path of REFERENCE_CLUSTER) {
  const file = fileForPath(path);
  if (!file) {
    failures.push({ name: "reference-page-missing", detail: `${path} was not prerendered` });
    continue;
  }
  const html = stripFooter(readFileSync(file, "utf8"));
  const missing = CLUSTER_TARGETS.filter(
    (target) => normPath(target) !== normPath(path) && !html.includes(`href="${target}"`),
  );
  if (missing.length) {
    failures.push({ name: "cluster-crosslink", detail: `${path} does not link to ${missing.join(", ")}` });
  }
}

// Counted outside the footer: every page carries the six reference URLs in the
// site-wide footer already, so including it would make this check pass no
// matter what. What matters is whether pages link to them *contextually*.
const clusterHostFiles = new Set(REFERENCE_CLUSTER.map((path) => fileForPath(path)).filter(Boolean));
const linking = files.filter((file) => {
  if (clusterHostFiles.has(file)) return false;
  const html = stripFooter(readFileSync(file, "utf8"));
  return CLUSTER_TARGETS.some((target) => html.includes(`href="${target}"`));
});
if (linking.length < MIN_CLUSTER_LINKING_PAGES) {
  failures.push({
    name: "cluster-inbound-links",
    detail: `only ${linking.length} pages link into the reference cluster (min ${MIN_CLUSTER_LINKING_PAGES})`,
  });
}

// Sitemap coverage: every listed URL must resolve to a file we have rendered.
const sitemapPath = join(DIST, "sitemap.xml");
if (!existsSync(sitemapPath)) {
  failures.push({ name: "sitemap-generated", detail: "dist/sitemap.xml is missing" });
} else {
  const sitemap = readFileSync(sitemapPath, "utf8");
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const unresolved = urls.filter((url) => {
    if (!url.startsWith(SITE_BASE)) return true;
    const path = url.slice(SITE_BASE.length) || "/";
    if (path === "/") return false;
    return !fileForPath(path.replace(/\/$/, "")) && !fileForPath(path);
  });
  if (unresolved.length) {
    // Routes served by the SPA fallback are legitimate; more than a handful is
    // a prerender gap, and those pages reach crawlers as the homepage shell.
    failures.push({ name: "sitemap-urls-rendered", detail: `${unresolved.length} sitemap URL(s) have no prerendered file, e.g. ${unresolved.slice(0, 3).join(", ")}` });
  }
  if (urls.length < 200) {
    failures.push({ name: "sitemap-url-count", detail: `sitemap lists only ${urls.length} URLs` });
  }
}

const summary = {
  ok: failures.length === 0,
  pagesChecked: pages.length,
  thin: pages.filter((p) => p.chars < MIN_TEXT_CHARS).length,
  shortest: pages.sort((a, b) => a.chars - b.chars).slice(0, 3).map((p) => `${p.file} (${p.chars} chars)`),
  clusterInboundPages: linking.length,
  warnings: warnings.slice(0, 5),
  failed: failures,
};

if (failures.length) {
  console.error(JSON.stringify(summary, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(summary, null, 2));
