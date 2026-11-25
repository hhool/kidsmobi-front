#!/usr/bin/env node
/**
 * Regenerates the GSC manual-submission queue from the LIVE sitemap.
 *
 * Why a generator and not a hand-kept file: the previous queue (20261125) was
 * built from an older sitemap and had drifted in BOTH directions — it carried
 * 13 URLs that no longer exist (the /guides/balance/ -> /guides/balance-bike/
 * migration) and was missing 84 URLs that now do. Hand-patching it would have
 * meant submitting dead URLs and skipping real ones.
 *
 * Priority is a reading of what actually needs a nudge, not a ranking:
 *   0  URLs the caller marks as new this round (--new), pinned to the top
 *   1  composite /guides/<cat>/<topic>/ pages — the index-threshold flips
 *   2  everything else (articles, hubs, hubs' zh editions)
 *
 * --new is explicit on purpose. Deriving "new" by diffing against the previous
 * queue file is wrong: that file may be many rounds stale, so the diff reports
 * every URL added since it was written (84, in the run that produced this
 * comment) and the top priority stops meaning "this round". Pass the handful
 * of URLs that actually shipped, e.g.
 *   --new /guides/budget/kids-scooter-ride-on-vs-convertible,...
 *
 * GSC's ~12/day manual quota is the real bottleneck and there is no public
 * "request indexing" API, so this file is the shortlist a human works down.
 *
 * Usage:
 *   node scripts/seo/gen-gsc-queue.mjs [--new <path,path,...>]
 *   node scripts/seo/gen-gsc-queue.mjs --from <sitemap.xml> --out <file>
 */
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const SITEMAP = arg("from", path.resolve("dist/sitemap.xml"));
const OUT = arg("out", path.resolve(".workbuddy/tmp/gsc/gsc_submit_queue_generated.txt"));
const PREV = arg("prev", path.resolve(".workbuddy/tmp/gsc/gsc_submit_queue_20261125.txt"));
const NEW = arg("new", "").split(",").map((s) => s.trim()).filter(Boolean);

if (!fs.existsSync(SITEMAP)) {
  console.error(`sitemap not found: ${SITEMAP} — run npm run build first`);
  process.exit(1);
}

const xml = fs.readFileSync(SITEMAP, "utf8");
const urls = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1].trim());
if (!urls.length) {
  console.error("no <loc> found in sitemap");
  process.exit(1);
}

// URLs this round introduced: supplied explicitly via --new, matched against
// the sitemap so a typo is reported rather than silently prioritised.
const newSet = new Set(NEW.map((p) => (p.startsWith("http") ? p : `https://balancebiketoddler.com${p}`)));
for (const n of newSet) {
  if (!urls.includes(n)) console.warn(`  WARNING: --new URL not in sitemap, ignored: ${n}`);
}
const isNew = (u) => newSet.has(u);

const isComposite = (u) => /\/guides\/[^/]+\/[^/]+\/$/.test(u);
const isZh = (u) => /\/zh\//.test(u);

const rank = (u) => {
  if (isNew(u)) return 0;
  if (isComposite(u) && !isZh(u)) return 1;
  if (isComposite(u) && isZh(u)) return 2;
  return 3;
};

const scored = urls.map((u) => ({ u, r: rank(u) }));
scored.sort((a, b) => a.r - b.r || a.u.localeCompare(b.u));

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, scored.map(({ u, r }) => `${r}\t${u}`).join("\n") + "\n");

const counts = scored.reduce((m, { r }) => ((m[r] = (m[r] || 0) + 1), m), {});
console.log(`wrote ${OUT}`);
console.log(`  total: ${scored.length}`);
for (const r of Object.keys(counts).sort()) {
  const label = { 0: "new this round", 1: "composite EN", 2: "composite ZH", 3: "rest" }[r];
  console.log(`  priority ${r} (${label}): ${counts[r]}`);
}
if (fs.existsSync(PREV)) {
  const prevUrls = new Set(
    fs.readFileSync(PREV, "utf8").split("\n").map((l) => l.split("\t")[1]).filter(Boolean),
  );
  const stale = [...prevUrls].filter((u) => !urls.includes(u));
  const missing = urls.filter((u) => !prevUrls.has(u));
  console.log(`  vs previous queue: ${stale.length} stale dropped, ${missing.length} not previously listed`);
}
if (NEW.length) console.log(`  marked new this round: ${NEW.length}`);