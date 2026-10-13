/**
 * Internal link integrity check for the prerendered site.
 *
 * Every internal href in dist must resolve to a file the build actually emits.
 * A prerendered site ships no router at request time, so a mis-slugged href is a
 * real 404 for both crawlers and readers — and unlike the SPA build there is no
 * client-side fallback that quietly papers over it.
 *
 * Usage:  node scripts/check-internal-links.mjs
 *         CHECK_LINKS_ROOT=dist_prev_v8 node scripts/check-internal-links.mjs
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

const ROOT = resolve(process.cwd(), process.env.CHECK_LINKS_ROOT || "dist");

if (!existsSync(ROOT)) {
  console.error(`No build output at ${ROOT}. Run \`npm run build\` first.`);
  process.exit(1);
}

function listFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) listFiles(full, out);
    else out.push(full);
  }
  return out;
}

const allFiles = listFiles(ROOT);
const htmlFiles = allFiles.filter((file) => file.endsWith(".html"));

/**
 * Every URL a file in the build can legitimately answer.
 * `about.html` answers both `/about` and `/about/` on Cloudflare Pages; the
 * sitemap canonicalises to whichever form the site publishes, but an internal
 * link to the other form still resolves, so both count as reachable.
 */
const reachable = new Set();
const addReachable = (url) => {
  if (!url) return;
  reachable.add(url);
  if (url !== "/" && url.endsWith("/")) reachable.add(url.slice(0, -1));
  if (url !== "/" && !url.endsWith("/")) reachable.add(`${url}/`);
};

for (const file of allFiles) {
  const rel = relative(ROOT, file).split(sep).join("/");
  if (rel === "index.html") {
    addReachable("/");
    continue;
  }
  // Anything else the build emits is served as-is from that path — favicon,
  // robots.txt, the sitemap — so a link to it resolves.
  if (!rel.endsWith(".html")) {
    addReachable(`/${rel}`);
    continue;
  }
  addReachable(`/${rel.replace(/\.html$/, "").replace(/\/index$/, "")}`);
}

// Public files that are not HTML pages: referenced, served, never linked as pages.
const passthrough = /^\/(assets|_headers|_redirects|api)\//;

const broken = new Map();
let checked = 0;

for (const file of htmlFiles) {
  const raw = readFileSync(file, "utf8");
  // Flags and JSON-LD restate the page's own URL; only real anchors can be broken.
  const html = raw.replace(/<script[\s\S]*?<\/script>/g, "");
  const hrefs = [...html.matchAll(/href="(\/[^"#?]*)"/g)].map((match) => match[1]);
  for (const href of new Set(hrefs)) {
    if (href.startsWith("//") || passthrough.test(href)) continue;
    checked += 1;
    if (reachable.has(href)) continue;
    if (!broken.has(href)) broken.set(href, new Set());
    broken.get(href).add(relative(ROOT, file).split(sep).join("/"));
  }
}

console.log(`internal link check — ${ROOT}`);
console.log(`  html pages: ${htmlFiles.length}   reachable urls: ${reachable.size}   hrefs checked: ${checked}`);

const rows = [...broken.entries()].sort((a, b) => b[1].size - a[1].size);
let instances = 0;
for (const [, sources] of rows) instances += sources.size;

if (rows.length === 0) {
  console.log("  ✓ every internal href resolves to a file in this build");
  process.exit(0);
}

console.log(`\n  ✗ ${rows.length} unresolved target(s), ${instances} link instance(s):\n`);
for (const [href, sources] of rows) {
  const shown = [...sources].slice(0, 4);
  const rest = sources.size - shown.length;
  console.log(
    `  ${String(sources.size).padStart(4)}  ${href}\n         from: ${shown.join(", ")}${rest > 0 ? ` (+${rest} more)` : ""}`,
  );
}
console.log(
  "\nCloudflare Pages has no client-side router, so each of these is a live 404 unless it is\n" +
    "covered by public/_redirects. Either fix the href or add a redirect.",
);
process.exit(1);
