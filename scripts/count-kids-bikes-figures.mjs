/**
 * Reprint every figure the kids-bikes category page publishes, counted from the
 * live published catalog.
 *
 * Why this exists. The /products/kids-bikes/ description claimed buyers could
 * "compare BMX style, training wheels, and dual suspension bicycles". The
 * structured `Suspension Type` attribute says otherwise — of the listings in
 * this category, almost all are rigid and exactly one is dual. The claim was
 * written once by hand and nothing re-checked it.
 *
 * This is the re-check, and the source of truth for any number that goes into
 * the kids-bikes title, description, keywords, or body copy. Run it before
 * quoting these figures, and after the bicycle category changes:
 *
 *   node scripts/count-kids-bikes-figures.mjs
 *
 * Scope, and this matters: **the published set, not the CMS set.** The CMS
 * carries 30 listings tagged `bicycle`, but the category page publishes 24 of
 * them — the rest were pruned as duplicates or are not published. Counting the
 * CMS tag would print numbers the page cannot back up. So the published set is
 * read off the live sitemap, whose `/products/kids-bikes/<id>` entries use the
 * CMS product id as the final path segment.
 */
const API_BASE = (process.env.CMS_API_BASE || "https://store.balancebiketoddler.com").replace(/\/+$/, "");
const SITE_BASE = (process.env.SITE_BASE || "https://balancebiketoddler.com").replace(/\/+$/, "");
const CATEGORY_PATH = "/products/kids-bikes/";

const sm = await fetch(`${SITE_BASE}/sitemap.xml`, { headers: { Accept: "application/xml" } });
if (!sm.ok) throw new Error(`sitemap read failed: HTTP ${sm.status}`);
const smXml = await sm.text();
const publishedIds = new Set(
  [...smXml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)]
    .map((m) => m[1])
    .filter((u) => u.includes(CATEGORY_PATH))
    .map((u) => u.slice(u.indexOf(CATEGORY_PATH) + CATEGORY_PATH.length).replace(/\/+$/, ""))
    .filter(Boolean),
);
if (!publishedIds.size) throw new Error(`no published kids-bikes urls found in sitemap`);

const res = await fetch(`${API_BASE}/api/cms/products?cb=${Date.now()}`, { headers: { Accept: "application/json" } });
if (!res.ok) throw new Error(`products read failed: HTTP ${res.status}`);
const payload = await res.json();
const all = Array.isArray(payload?.data) ? payload.data : [];
if (!all.length) throw new Error("products collection came back empty");

const tagged = all.filter((p) => p.category === "bicycle" || p.categoryId === "bicycle");
/** Published = listed under this category path in the sitemap. Id is the key. */
const list = all.filter((p) => publishedIds.has(String(p.id)));
const tagOnly = tagged.filter((p) => !publishedIds.has(String(p.id)));
const publishedElsewhere = list.filter((p) => !(p.category === "bicycle" || p.categoryId === "bicycle"));

const name = (p) => String(p.name || "");
const attrs = (p) => p.Category_Attributes || {};
const norm = (v) => String(v ?? "").trim().replace(/\s+/g, " ");

/** Brake Style arrives as either "Coaster" or "Caliper, Coaster" — split it. */
const brakeStyles = (p) => {
  const raw = norm(attrs(p)["Brake Style"]);
  if (!raw) return [];
  return raw
    .split(/[,+]/)
    .map((s) => s.replace(/brakes?/gi, "").trim())
    .filter(Boolean);
};

const tally = (values) => {
  const m = {};
  for (const v of values) {
    if (!v) continue;
    m[v] = (m[v] || 0) + 1;
  }
  return Object.entries(m).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
};
const show = (rows) => rows.map(([k, v]) => `${k} x${v}`).join(", ") || "(none)";

console.log(`published under ${CATEGORY_PATH}: ${list.length} listings`);
console.log(`  CMS tagged "bicycle": ${tagged.length}  (${tagOnly.length} tagged but not published here)`);
if (tagOnly.length) console.log(`    not published: ${tagOnly.map((p) => String(p.id)).join(", ")}`);
if (publishedElsewhere.length) {
  console.log(`  published here but tagged elsewhere: ${publishedElsewhere.length}`);
  for (const p of publishedElsewhere) console.log(`    ${p.id} [${p.category}] ${name(p).slice(0, 48)}`);
}
console.log();

const sub = tally(list.map((p) => p.taxonomy?.subcategoryId || p.subcategoryId));
console.log(`subcategory:             ${show(sub)}`);

const wheels = tally(list.map((p) => norm(attrs(p)["Wheel Size"])));
const withWheel = list.filter((p) => norm(attrs(p)["Wheel Size"])).length;
console.log(`wheel size (attribute):  ${withWheel}/${list.length}  ${show(wheels)}`);

const brakes = tally(list.flatMap(brakeStyles));
console.log(`brake style:             ${show(brakes)}`);

const susp = tally(list.map((p) => norm(attrs(p)["Suspension Type"])));
console.log(`suspension type:         ${show(susp)}`);

const dual = list.filter((p) => /^dual$/i.test(norm(attrs(p)["Suspension Type"])));
const front = list.filter((p) => /^front$/i.test(norm(attrs(p)["Suspension Type"])));
const rigid = list.filter((p) => /^rigid$/i.test(norm(attrs(p)["Suspension Type"])));
console.log(`  dual: ${dual.length}   front: ${front.length}   rigid: ${rigid.length}`);
if (dual.length) console.log(`  dual listings: ${dual.map((p) => name(p).slice(0, 48)).join(" | ")}`);

const tw = list.filter((p) => /training wheel/i.test(name(p)) || /training wheel/i.test(norm(attrs(p)["Special Feature"])));
console.log(`\ntraining wheels:         ${tw.length}/${list.length}`);

const bmx = list.filter((p) => /\bbmx\b/i.test(name(p)));
console.log(`bmx style (title):       ${bmx.length}/${list.length}`);

const ages = {};
for (const p of list) {
  for (const m of name(p).matchAll(/(\d+)\s*-\s*(\d+)\s*(?:\+)?\s*(year|yr)/gi)) {
    ages[`${m[1]}-${m[2]}`] = (ages[`${m[1]}-${m[2]}`] || 0) + 1;
  }
}
console.log(`age span in title:       ${show(Object.entries(ages).sort((a, b) => b[1] - a[1]))}`);

const ageDesc = tally(list.map((p) => norm(attrs(p)["Age Range Description"])));
console.log(`age range (attribute):   ${show(ageDesc)}`);
console.log(`  (coarse — do not build age keywords on this field)`);
