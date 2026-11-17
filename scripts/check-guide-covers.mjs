/**
 * Guide cover uniqueness.
 *
 * /guides renders one card per article, using the article's CMS `imageUrl`.
 * Eight travel-stroller guides all pointed at the SAME image, so the page
 * showed eight cards with one photo — and because imageUrl is also the
 * article's og:image, all eight shared one social card too.
 *
 * Invariants enforced here:
 *   1. No cover is shared by more than two published guides. Two is tolerated
 *      (sibling articles on one product line), three or more is a defect:
 *      it reads as a bug to anyone scanning the list.
 *   2. The eight travel-stroller guides are pairwise distinct. This is the
 *      specific group that regressed; a looser global rule would have let it
 *      slip back to 8.
 *
 * Reads the committed CMS snapshot, so it runs offline and catches a bad
 * import before a build.
 *
 * Usage: node scripts/check-guide-covers.mjs
 */
import { readFileSync } from "node:fs";

const SNAPSHOT = "scripts/cms-snapshots/guides.json";

/** The travel-stroller cluster that must stay de-duplicated. */
const TRAVEL_STROLLER = [
  "best-travel-stroller-2026",
  "stroller-travel-airplane",
  "best-travel-stroller-for-3-year-old",
  "travel-stroller-for-2-year-old",
  "travel-stroller-for-cruise",
  "travel-stroller-for-toddler",
  "compact-travel-stroller",
  "lightweight-travel-stroller",
];

const MAX_SHARERS = 2;

const guides = JSON.parse(readFileSync(SNAPSHOT, "utf8")).filter(
  (g) => g.status === "published" && String(g.imageUrl || "").trim(),
);

const findings = [];

// 1. No cover shared by more than MAX_SHARERS guides.
const byCover = new Map();
for (const g of guides) {
  const url = String(g.imageUrl).trim();
  if (!byCover.has(url)) byCover.set(url, []);
  byCover.get(url).push(g.slug);
}
for (const [url, slugs] of byCover) {
  if (slugs.length > MAX_SHARERS) {
    findings.push(
      `${slugs.length} guides share one cover (max ${MAX_SHARERS}): ${url.split("/").slice(-2, -1)[0]}\n    ${slugs.join("\n    ")}`,
    );
  }
}

// 2. The travel-stroller cluster is pairwise distinct.
const travelSlugs = guides.filter((g) => TRAVEL_STROLLER.includes(g.slug));
const missing = TRAVEL_STROLLER.filter((s) => !travelSlugs.some((g) => g.slug === s));
if (missing.length) findings.push(`travel-stroller guides missing from snapshot: ${missing.join(", ")}`);
const travelCovers = travelSlugs.map((g) => String(g.imageUrl).trim());
if (new Set(travelCovers).size !== travelCovers.length) {
  const dupes = travelCovers.filter((u, i) => travelCovers.indexOf(u) !== i);
  findings.push(`travel-stroller covers are not unique: ${[...new Set(dupes)].length} duplicated URL(s)`);
}

if (findings.length) {
  console.error(`check:covers FAILED — ${findings.length} finding(s)`);
  for (const f of findings) console.error("  - " + f);
  process.exit(1);
}
console.log(
  `check:covers OK — no cover shared by >${MAX_SHARERS} guides; ${TRAVEL_STROLLER.length} travel-stroller covers distinct`,
);
