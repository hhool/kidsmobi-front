/**
 * assign-guide-images.mjs — give every published guide a representative photo.
 *
 * The 40 guides authored in write-40-guides.mjs shipped without an imageUrl, so
 * the /guides grid fell back to the BookOpen icon and the detail pages had no
 * hero. Rather than burn image-generation credits for illustrations, this
 * script matches each guide to a real product photo from the existing CMS
 * catalog (213 products, all with public store-hosted images) using the guide's
 * own topic: a travel-stroller guide gets a travel stroller, a 24V ride-on guide
 * gets a 24V ride-on, and so on. The 16 legacy guides published before that
 * batch were mapped in the same pass (they had no imageUrl either).
 *
 * Usage:
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/assign-guide-images.mjs            # print the mapping
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/assign-guide-images.mjs --write    # patch imageUrl into CMS
 */

import fs from "node:fs";

const API_BASE = "https://store.balancebiketoddler.com";
const TOKEN = process.env.CMS_ADMIN_ALL_TOKEN || "";
const WRITE = process.argv.includes("--write");
const CACHE = "/tmp/cms-export.json";

const STORE_ORIGIN = "https://store.balancebiketoddler.com";

/** Relative scrape_store/.. paths -> absolute store URL (mirrors toStoreMediaUrl). */
function toPublicImageUrl(raw) {
  const text = String(raw || "").trim().replace(/\\/g, "/");
  if (!text) return "";
  if (/^https?:\/\//i.test(text)) return text;
  const marker = "scrape_store/";
  const idx = text.indexOf(marker);
  const mediaPath = idx >= 0 ? text.slice(idx + marker.length) : text.replace(/^\.+\/+/, "");
  if (!mediaPath) return "";
  const encoded = mediaPath.split("/").filter(Boolean).map((s) => encodeURIComponent(s)).join("/");
  return encoded ? `${STORE_ORIGIN}/${encoded}` : "";
}

// ---------------------------------------------------------------------------
// Per-guide matching rules.
//   cats      — allowed product categoryIds
//   any       — name must contain at least one of these (lowercased)
//   none      — name must contain none of these
//   maxPrice  — optional price ceiling (price-specific guides only)
// ---------------------------------------------------------------------------
const RULES = {
  // ---- Stroller -----------------------------------------------------------
  "stroller-travel-airplane": { cats: ["stroller"], any: ["travel stroller", "airplane", "carry-on", "compact"], none: ["double", "wagon", "swing"] },
  "stroller-newborn-picks": { cats: ["stroller"], any: ["lie-flat", "reversible", "pramette", "newborn", "infant stroller", "2-in-1"], none: ["wagon", "double", "twin", "side by side"] },
  "stroller-umbrella-vs-full": { cats: ["stroller"], any: ["umbrella", "liteway", "cloud plus"], none: ["double", "wagon"] },
  "stroller-jogging-guide": { cats: ["stroller"], any: ["jogger", "jogging"], none: ["double", "wagon"] },
  "stroller-double-twins": { cats: ["stroller"], any: ["double", "twin", "side by side", "tandem", "sit n"], none: ["wagon"] },
  "stroller-travel-system": { cats: ["stroller"], any: ["travel system", "car seat"], none: ["wagon"] },
  "stroller-safety-tips": { cats: ["stroller"], any: ["stroller"], none: ["wagon", "swing"] },
  "stroller-how-to-clean": { cats: ["stroller"], any: ["stroller"], none: ["wagon", "swing"] },
  "stroller-under-200": { cats: ["stroller"], any: ["stroller"], none: ["wagon", "swing"], maxPrice: 200 },
  "stroller-all-terrain": { cats: ["stroller", "kids_pull_along_wagons"], any: ["all-terrain", "all terrain", "city mini gt2", "wagon"], none: [] },

  // ---- Kids bike ----------------------------------------------------------
  "kids-bike-first-by-age": { cats: ["kids_bikes"], any: ["kids bike", "freestyle", "bmx"], none: ["helmet"] },
  "kids-bike-balance-vs-training-wheels": { cats: ["balance_bike", "kids_bikes"], any: ["balance bike", "no pedal", "strider"], none: ["helmet", "tricycle"] },
  "kids-bike-size-chart": { cats: ["kids_bikes"], any: ["12", "14", "16", "18", "20"], none: ["helmet"] },
  "kids-bike-best-16-inch": { cats: ["kids_bikes"], any: ["16"], none: ["helmet", "balance"] },
  "kids-bike-best-20-inch": { cats: ["kids_bikes"], any: ["20"], none: ["helmet", "balance"] },
  "kids-bike-helmet-fit": { cats: [], any: ["helmet"], none: [] },
  "kids-bike-under-100": { cats: ["kids_bikes"], any: ["bike", "bicycle"], none: ["helmet", "balance"], maxPrice: 100 },
  "kids-bike-teach-to-ride": { cats: ["balance_bike", "kids_bikes"], any: ["balance bike", "no pedal", "strider", "cricket"], none: ["helmet"] },
  "kids-bike-chain-tire-care": { cats: ["kids_bikes"], any: ["mountain bike", "bike"], none: ["helmet", "balance"] },
  "kids-bike-coaster-vs-hand-brake": { cats: ["kids_bikes"], any: ["hand brake", "coaster", "speed", "dual"], none: ["helmet", "balance"] },

  // ---- Kids scooter -------------------------------------------------------
  "kids-scooter-3-vs-2-wheel": { cats: ["scooters"], any: ["scooter"], none: ["electric"] },
  "kids-scooter-best-4-year": { cats: ["scooters"], any: ["scooter"], none: ["electric", "adults", "teens", "6+", "240"] },
  "kids-scooter-best-6-8-school": { cats: ["scooters"], any: ["scooter"], none: ["electric"] },
  "kids-scooter-kick-vs-electric": { cats: ["scooters"], any: ["scooter"], none: ["electric"] },
  "kids-scooter-helmet-pads": { cats: [], any: ["helmet"], none: [] },
  "kids-scooter-foldable-travel": { cats: ["scooters"], any: ["scooter"], none: ["electric"] },
  "kids-scooter-adjustable-height": { cats: ["scooters"], any: ["scooter"], none: ["electric"] },
  "kids-scooter-fix-wobbly-wheel": { cats: ["scooters"], any: ["scooter"], none: ["electric"] },
  "kids-scooter-under-50": { cats: ["scooters"], any: ["scooter"], none: ["electric"], maxPrice: 50 },
  "kids-scooter-vs-bike-commute": { cats: ["scooters"], any: ["scooter"], none: ["electric"] },

  // ---- Kids ride-on / electric car ---------------------------------------
  "kids-ride-on-12v-vs-24v": { cats: ["electric_vehicles"], any: ["24v", "ride on", "ride-on"], none: ["scooter", "wiggle", "push car", "tractor"] },
  "kids-ride-on-best-24v-2-seater": { cats: ["electric_vehicles"], any: ["24v", "2-seater", "2 seater"], none: ["scooter", "wiggle", "push car", "tractor"] },
  "kids-ride-on-parental-remote": { cats: ["electric_vehicles"], any: ["remote"], none: ["scooter", "wiggle", "push car", "tractor"] },
  "kids-ride-on-best-3-year": { cats: ["electric_vehicles", "kids_push_ride_ons"], any: ["toddler", "push car", "12v"], none: ["scooter", "wiggle"] },
  "kids-ride-on-weight-limit": { cats: ["electric_vehicles"], any: ["ride on", "ride-on"], none: ["scooter", "wiggle", "push car", "tractor"] },
  "kids-ride-on-battery-care": { cats: ["electric_vehicles"], any: ["12v"], none: ["scooter", "wiggle", "push car", "tractor"] },
  "kids-ride-on-under-200": { cats: ["electric_vehicles"], any: ["ride on", "ride-on", "12v"], none: ["scooter", "wiggle", "push car", "tractor"], maxPrice: 200 },
  "kids-ride-on-2-seater-vs-single": { cats: ["electric_vehicles"], any: ["2-seater", "2 seater", "ride on", "ride-on"], none: ["scooter", "wiggle", "push car", "tractor"] },
  "kids-ride-on-tires-grass": { cats: ["electric_vehicles"], any: ["all-terrain", "ride on", "ride-on"], none: ["scooter", "wiggle", "push car", "tractor"] },
  "kids-ride-on-winter-storage": { cats: ["electric_vehicles"], any: ["12v", "ride on", "ride-on"], none: ["scooter", "wiggle", "push car", "tractor"] },

  // ---- Legacy library guides (the 16 published before the 40-guide batch) --
  // These shipped without imageUrl, so their grid cards and detail heroes fell
  // back to the BookOpen placeholder. The 13 guide-2026-* balance guides share
  // one product pool; the script spreads unused photos first and only reuses
  // when the pool runs out (12 pure balance bikes, 14 balance guides). Guides
  // with a hand-picked product are listed first so they claim it before the
  // no-preference guides drain the pool.
  "best-balance-bike-for-1-year-old": { cats: ["balance_bike"], any: ["1 year old", "1-2 years", "12-24 month", "baby balance"], none: ["tricycle", "push handle", "in 1", "walker"] },
  "balance-bike-weight": { cats: ["balance_bike"], any: [], none: ["tricycle", "push handle", "in 1", "walker"] },
  "balance-bike-price-tiers": { cats: ["balance_bike"], any: [], none: ["tricycle", "push handle", "in 1", "walker"] },
  "graco-modes-pramette-travel-system": { cats: ["stroller"], any: ["pramette", "travel system"], none: ["wagon"] },
  "how-to-choose-the-perfect-baby-stroller": { cats: ["stroller"], any: ["stroller"], none: ["wagon", "double", "twin", "jogger", "jogging", "car seat", "umbrella", "travel", "tandem"] },
  "balance-bike-by-age": { cats: ["balance_bike"], any: [], none: ["tricycle", "push handle", "in 1", "walker"] },
  "balance-bike-size-chart": { cats: ["balance_bike"], any: [], none: ["tricycle", "push handle", "in 1", "walker"] },
  "balance-bike-vs-training-wheels": { cats: ["balance_bike"], any: [], none: ["tricycle", "push handle", "in 1", "walker"] },
  "balance-bike-stability": { cats: ["balance_bike"], any: [], none: ["tricycle", "push handle", "in 1", "walker"] },
  "balance-bike-what-buyers-say": { cats: ["balance_bike"], any: [], none: ["tricycle", "push handle", "in 1", "walker"] },
  "balance-bike-safety-checks": { cats: ["balance_bike"], any: [], none: ["tricycle", "push handle", "in 1", "walker"] },
  "balance-bike-recalls": { cats: ["balance_bike"], any: [], none: ["tricycle", "push handle", "in 1", "walker"] },
  "balance-bike-safety-standards": { cats: ["balance_bike"], any: [], none: ["tricycle", "push handle", "in 1", "walker"] },
  "balance-bikes-extra-support": { cats: ["balance_bike"], any: [], none: ["tricycle", "push handle", "in 1", "walker"] },
  "balance-bike-maintenance": { cats: ["balance_bike"], any: [], none: ["tricycle", "push handle", "in 1", "walker"] },
  "where-to-ride-balance-bike": { cats: ["balance_bike"], any: [], none: ["tricycle", "push handle", "in 1", "walker"] },
};

/**
 * Preferred product id per guide — chosen by hand so each guide shows a photo
 * of the exact product class it discusses (travel stroller, 24V 2-seater,
 * 3-wheel scooter, ...). The rule pool stays as a validation net: if a
 * preferred id drifts out of its pool (product renamed/re-categorised) the
 * script falls back to the best unused pool member and the pool count in the
 * report makes the drift visible.
 */
const PREFERRED = {
  // Stroller
  "stroller-travel-airplane": "stroller-b0fcmtqk6c",
  "stroller-newborn-picks": "stroller-b0dlkjfk39",
  "stroller-umbrella-vs-full": "stroller-b0d98vgyvz",
  "stroller-jogging-guide": "stroller-b00fzp3e8a",
  "stroller-double-twins": "stroller-b00gjixp5o",
  "stroller-travel-system": "stroller-b0dxwvhc6x",
  "stroller-safety-tips": "stroller-b0bsp4k34f",
  "stroller-how-to-clean": "stroller-b07gghvl64",
  "stroller-under-200": "stroller-b09fl7lv9w",
  "stroller-all-terrain": "kids_pull_along_wagons-b0djy3jh8d",
  // Kids bike
  "kids-bike-first-by-age": "kids_bikes-b0c772bkg2",
  "kids-bike-balance-vs-training-wheels": "balance_bike-b00izxbzbm",
  "kids-bike-size-chart": "kids_bikes-b00d3eqb3k",
  "kids-bike-best-16-inch": "kids_bikes-b0c2h8sfbq",
  "kids-bike-best-20-inch": "kids_bikes-b0146f8l7i",
  "kids-bike-helmet-fit": "electric_vehicles-b07cjv1975",
  "kids-bike-under-100": "kids_bikes-b0gs4qq8fy",
  "kids-bike-teach-to-ride": "balance_bike-b0fmnwhrmx",
  "kids-bike-chain-tire-care": "kids_bikes-b0f7xmj87q",
  "kids-bike-coaster-vs-hand-brake": "kids_bikes-b0dhr7xkqq",
  // Kids scooter (7 products, 10 guides — two deliberate reuses)
  "kids-scooter-3-vs-2-wheel": "scooters-b08zcm11j6",
  "kids-scooter-best-4-year": "scooters-b0bpxrvwyk",
  "kids-scooter-best-6-8-school": "scooters-b01en6ltaq",
  "kids-scooter-kick-vs-electric": "scooters-b0dzg3qylr",
  "kids-scooter-helmet-pads": "electric_vehicles-b07cjv1975",
  "kids-scooter-foldable-travel": "scooters-b09zy6m8xh",
  "kids-scooter-adjustable-height": "scooters-b0ccymv1t1",
  "kids-scooter-fix-wobbly-wheel": "scooters-b07vy9q95q",
  "kids-scooter-under-50": "scooters-b0dzg3qylr",
  "kids-scooter-vs-bike-commute": "scooters-b09zy6m8xh",
  // Kids ride-on / electric car
  "kids-ride-on-12v-vs-24v": "electric_vehicles-b0fgxr4x4t",
  "kids-ride-on-best-24v-2-seater": "electric_vehicles-b0dz3r72ns",
  "kids-ride-on-parental-remote": "electric_vehicles-b0f9ps1l56",
  "kids-ride-on-best-3-year": "electric_vehicles-b0f5ghhdhc",
  "kids-ride-on-weight-limit": "electric_vehicles-b07yc4vcyh",
  "kids-ride-on-battery-care": "electric_vehicles-b0cy5hrl3k",
  "kids-ride-on-under-200": "electric_vehicles-b0g1lf5lr3",
  "kids-ride-on-2-seater-vs-single": "electric_vehicles-b0db5k3jf4",
  "kids-ride-on-tires-grass": "electric_vehicles-b0fss9pr84",
  "kids-ride-on-winter-storage": "electric_vehicles-b017hhkgie",
  // Legacy library guides. The two ASIN-tagged overview guides point at the
  // exact product they review when it is still in the catalog; the flagship
  // stroller guide and the weight/price/age topics get a hand-picked match.
  "graco-modes-pramette-travel-system": "stroller-b07y5vqyfw",
  "how-to-choose-the-perfect-baby-stroller": "stroller-b0fpfz9yql",
  "best-balance-bike-for-1-year-old": "balance_bike-b0fvrv5hzb",
  "balance-bike-weight": "balance_bike-b0fzvlg7yq",
  "balance-bike-price-tiers": "balance_bike-b09z65pbxp",
};

function loadExport() {
  if (fs.existsSync(CACHE)) return JSON.parse(fs.readFileSync(CACHE, "utf8"));
  throw new Error(`missing ${CACHE}; re-fetch the CMS export first`);
}

function main() {
  const exportJson = loadExport();
  const products = (exportJson?.data?.collections?.products || []).map((p) => ({
    id: p.id,
    name: String(p.name || ""),
    brand: String(p.brand || ""),
    categoryId: String(p.categoryId || ""),
    price: Number(p.price || 0),
    imageUrl: toPublicImageUrl(p.imageUrl),
  })).filter((p) => p.imageUrl);

  const usedBy = new Map(); // productId -> slug (avoid reusing the same photo)
  const useCount = new Map(); // productId -> times used (for least-used reuse)
  const mapping = {};
  const problems = [];

  for (const [slug, rule] of Object.entries(RULES)) {
    const pool = products.filter((p) => {
      if (rule.cats.length && !rule.cats.includes(p.categoryId)) return false;
      const name = p.name.toLowerCase();
      if (rule.any.length && !rule.any.some((k) => name.includes(k))) return false;
      if (rule.none.length && rule.none.some((k) => name.includes(k))) return false;
      if (rule.maxPrice && !(p.price > 0 && p.price <= rule.maxPrice)) return false;
      return true;
    });

    const preferredId = PREFERRED[slug];
    const preferred = preferredId ? products.find((p) => p.id === preferredId) : null;
    const preferredValid = Boolean(preferred && pool.includes(preferred));

    // 1) hand-picked product, if still in the pool and not yet used
    // 2) any unused pool member
    // 3) reuse: the hand-picked one, else the least-used pool member
    let pick = preferredValid && !usedBy.has(preferred.id) ? preferred : null;
    if (!pick) pick = pool.find((p) => !usedBy.has(p.id)) || null;
    if (!pick) {
      if (preferredValid) pick = preferred;
      else if (pool.length) {
        pick = pool.slice().sort((a, b) => (useCount.get(a.id) || 0) - (useCount.get(b.id) || 0))[0];
      }
    }
    if (!pick) {
      problems.push(`${slug}: no matching product (pool ${pool.length})`);
      continue;
    }
    if (!preferredValid && preferredId) {
      problems.push(`${slug}: preferred ${preferredId} not in pool (pool ${pool.length}) -> fell back to ${pick.id}`);
    }
    usedBy.set(pick.id, slug);
    useCount.set(pick.id, (useCount.get(pick.id) || 0) + 1);
    mapping[slug] = {
      imageUrl: pick.imageUrl,
      alt: slug,
      productId: pick.id,
      productName: pick.name.slice(0, 80),
      price: pick.price,
      pool: pool.length,
    };
  }

  console.log(`products with public image: ${products.length}`);
  console.log(`guides mapped: ${Object.keys(mapping).length}/${Object.keys(RULES).length}`);
  if (problems.length) {
    console.log("\nPROBLEMS:");
    problems.forEach((p) => console.log("  - " + p));
  }
  console.log("\nslug -> product");
  for (const [slug, m] of Object.entries(mapping)) {
    console.log(`  ${slug}\n      ${m.productName}  $${m.price}  (pool ${m.pool})`);
  }

  if (!WRITE) {
    console.log("\nDry run. Re-run with --write to patch imageUrl into CMS.");
    return;
  }

  if (!TOKEN) {
    console.error("CMS_ADMIN_ALL_TOKEN is required for --write.");
    process.exit(1);
  }

  (async () => {
    // Ground truth straight from D1 (admin export bypasses the edge cache).
    const res = await fetch(`${API_BASE}/api/cms/ops/export`, { headers: { "x-cms-admin-token": TOKEN } });
    if (!res.ok) throw new Error(`export HTTP ${res.status}`);
    const live = (await res.json())?.data?.collections?.guides || [];
    const bySlug = new Map(live.map((g) => [String(g.slug || "").toLowerCase(), g]));

    let ok = 0;
    const failed = [];
    for (const [slug, m] of Object.entries(mapping)) {
      const record = bySlug.get(slug.toLowerCase());
      if (!record) {
        failed.push(`${slug}: not live`);
        continue;
      }
      if (String(record.imageUrl || "") === m.imageUrl) {
        ok += 1;
        continue;
      }
      const payload = { ...record, imageUrl: m.imageUrl, updatedAt: new Date().toISOString() };
      const save = await fetch(`${API_BASE}/api/cms/guides/save`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-cms-admin-token": TOKEN,
        },
        body: JSON.stringify(payload),
      });
      if (!save.ok) {
        failed.push(`${slug}: HTTP ${save.status} ${(await save.text()).slice(0, 120)}`);
        continue;
      }
      ok += 1;
    }
    console.log(`\nwritten: ${ok}/${Object.keys(mapping).length}`);
    if (failed.length) {
      console.log("FAILED:");
      failed.forEach((f) => console.log("  - " + f));
      process.exit(1);
    }
  })().catch((e) => {
    console.error("WRITE ERROR:", e.message);
    process.exit(1);
  });
}

main();
