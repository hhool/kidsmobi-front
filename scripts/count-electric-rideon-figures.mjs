/**
 * Reprint every figure the electric ride-on articles publish, counted from the
 * live published catalog.
 *
 * Why this exists. Two published news articles (electric-dirt-bikes-for-kids and
 * kids-electric-bike-development-trends-2026) quoted counts that the catalog
 * does not support — 14 of 16 titles with a voltage when it is 15, a charging
 * time in 6 spec sheets when no listing states one, and a "1.5-4 MPH" that is
 * really an age range in a title. The numbers were counted by hand once, at
 * writing time, and nothing re-checked them afterwards.
 *
 * This is the re-check. Run it before quoting these figures anywhere, and after
 * the electric category changes:
 *
 *   node scripts/count-electric-rideon-figures.mjs
 *
 * Scope, same as the articles: the electric ride-on category, with the helmet
 * listing excluded — it carries the category tag but the category page does not
 * show it, and it is not a ride-on.
 */
const API_BASE = (process.env.CMS_API_BASE || "https://store.balancebiketoddler.com").replace(/\/+$/, "");

const res = await fetch(`${API_BASE}/api/cms/products?cb=${Date.now()}`, { headers: { Accept: "application/json" } });
if (!res.ok) throw new Error(`products read failed: HTTP ${res.status}`);
const payload = await res.json();
const all = Array.isArray(payload?.data) ? payload.data : [];
if (!all.length) throw new Error("products collection came back empty");

const tagged = all.filter((p) => p.category === "electric_car" || p.categoryId === "electric_car");
const helmet = tagged.filter((p) => /helmet/i.test(String(p.name || "")));
const list = tagged.filter((p) => !/helmet/i.test(String(p.name || "")));

const name = (p) => String(p.name || "");
const flat = (p) => {
  const out = [];
  const walk = (o) => {
    for (const [k, v] of Object.entries(o || {})) {
      if (v && typeof v === "object") walk(v);
      else out.push([String(k), String(v)]);
    }
  };
  walk(p.Product_Specifications || {});
  return out;
};
const specHas = (p, re) => flat(p).some(([k]) => re.test(k));
/** Key or value — a remote listed under "Included Components" is stated by the spec sheet. */
const specMentions = (p, re) => flat(p).some(([k, v]) => re.test(k) || re.test(v));
const specVal = (p, re) => flat(p).find(([k]) => re.test(k))?.[1] ?? "";
const voltOf = (p) => {
  const m = name(p).match(/(\d+(?:\.\d+)?)\s*v\b/i);
  return m ? `${m[1]}V` : "none";
};

console.log(`electric ride-on category: ${tagged.length} tagged, ${helmet.length} helmet (not shown), ${list.length} counted\n`);

const volts = {};
const noVolt = [];
for (const p of list) {
  const m = name(p).match(/(\d+(?:\.\d+)?)\s*v\b/i);
  if (m) volts[m[1] + "V"] = (volts[m[1] + "V"] || 0) + 1;
  else noVolt.push(name(p).slice(0, 60));
}
const withVolt = list.length - noVolt.length;
const parts = Object.entries(volts)
  .sort((a, b) => b[1] - a[1])
  .map(([v, n]) => `${v} x${n}`)
  .join(", ");
console.log(`voltage in title:        ${withVolt}/${list.length}  ${parts}`);
console.log(`  without:               ${noVolt.join(" | ") || "(none)"}`);

console.log(`\nspec-sheet coverage (of ${list.length}):`);
const rows = [
  ["top speed", /speed/i],
  ["braking", /brake|braking/i],
  ["tire type", /tire|tyre|pneumatic|\beva\b/i],
  ["motor wattage", /watt|\d+\s*w\b/i],
  ["parental remote*", /remote|parent(?:al)? control/i],
  ["battery average life", /battery average life/i],
  ["charging time", /charg(?:ing)?\s*time/i],
  ["weight capacity", /weight capacity/i],
  ["minimum age", /minimum age/i],
];
for (const [label, re] of rows) {
  const n = list.filter((p) => (label.endsWith("*") ? specMentions(p, re) : specHas(p, re))).length;
  console.log(`  ${label.padEnd(22)} ${n}/${list.length}`);
}
const remoteTitles = list.filter((p) => /remote|parent(?:al)? control/i.test(name(p))).length;
console.log(`  ${"parental remote (title)".padEnd(22)} ${remoteTitles}/${list.length}`);
console.log(`  ${"assembly required".padEnd(22)} ${list.filter((p) => /^yes$/i.test(specVal(p, /is assembly required/i).trim())).length}/${list.length}`);

console.log("\ntitle copy (not published specs):");
for (const p of list) {
  const speeds = [...name(p).matchAll(/(\d+(?:\.\d+)?)\s*(?:-\s*(\d+(?:\.\d+)?)\s*)?(mph|km\/h)/gi)].map((m) => m[0]);
  if (speeds.length) {
    const v = name(p).match(/(\d+(?:\.\d+)?)\s*v\b/i);
    console.log(`  speed ${speeds.join(", ").padEnd(10)} | voltage ${(v ? v[1] + "V" : "none").padEnd(5)} | ${name(p).slice(0, 60)}`);
  }
}

const caps = list
  .map((p) => Number(specVal(p, /weight capacity/i).replace(/[^0-9.]/g, "")))
  .filter((n) => Number.isFinite(n) && n > 0)
  .sort((a, b) => a - b);
if (caps.length) console.log(`\nweight capacity stated:  ${caps.length}/${list.length}  range ${caps[0]}-${caps[caps.length - 1]} lb`);

const ages = list
  .map((p) => Number(specVal(p, /minimum age/i).replace(/[^0-9.]/g, "")))
  .filter((n) => Number.isFinite(n) && n > 0)
  .sort((a, b) => a - b);
if (ages.length) {
  console.log(
    `minimum age stated:      ${ages.length}/${list.length}  ${ages.filter((a) => a >= 36).length} at >= 36 months, values ${ages.join(", ")}`
  );
}

for (const tier of ["12V", "24V", "6V", "36V", "none"]) {
  const group = list.filter((p) => voltOf(p) === tier);
  if (!group.length) continue;
  const remotes = group.filter((p) => /remote|parent(?:al)? control/i.test(name(p))).length;
  const tierCaps = group
    .map((p) => Number(specVal(p, /weight capacity/i).replace(/[^0-9.]/g, "")))
    .filter((n) => Number.isFinite(n) && n > 0);
  const tierAges = group
    .map((p) => Number(specVal(p, /minimum age/i).replace(/[^0-9.]/g, "")))
    .filter((n) => Number.isFinite(n) && n > 0);
  console.log(
    `  ${tier}: ${group.length} listing(s), remote in ${remotes}/${group.length} titles` +
      (tierCaps.length ? `, capacity ${Math.min(...tierCaps)}-${Math.max(...tierCaps)} lb (${tierCaps.length} stated)` : "") +
      (tierAges.length ? `, min age ${Math.min(...tierAges)}-${Math.max(...tierAges)} months` : "")
  );
}
