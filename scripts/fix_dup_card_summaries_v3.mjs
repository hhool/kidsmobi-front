#!/usr/bin/env node
/**
 * P0-2 v3: de-boilerplate duplicated card summaries.
 *
 * The v2 generator's category fallback collapsed ~97 stroller records (and a
 * few others) onto identical copy because weight/brake extraction failed for
 * specs stored as unit-bearing strings ("11.57 Kilograms", "17.8 Pounds").
 * This script finds every cardSummary shared by 2+ products and regenerates
 * per-record copy from unit-aware spec extraction + price/rating identity.
 *
 * Usage:
 *   node scripts/fix_dup_card_summaries_v3.mjs            # dry run
 *   node scripts/fix_dup_card_summaries_v3.mjs --apply    # write to D1
 */

const apply = process.argv.includes("--apply");
const API_BASE = (process.env.CMS_API_BASE || "https://store.balancebiketoddler.com").replace(/\/+$/, "");

const clean = (v) => String(v ?? "").replace(/\s+/g, " ").trim();
const has = (v) => clean(v) !== "" && clean(v) !== "None";

function findSpec(product, keyPattern) {
  const specs = product.Product_Specifications;
  if (!specs || typeof specs !== "object") return "";
  const stack = [specs];
  while (stack.length) {
    const node = stack.shift();
    if (!node || typeof node !== "object") continue;
    if (Array.isArray(node)) { stack.push(...node); continue; }
    for (const [key, value] of Object.entries(node)) {
      if (keyPattern.test(key) && typeof value === "string" && clean(value) && clean(value).length <= 90) {
        return clean(value);
      }
      if (value && typeof value === "object") stack.push(value);
    }
  }
  return "";
}

/** Unit-aware weight in lb: "17.8 Pounds" -> 17.8, "11.57 Kilograms" -> 25.5 */
function parseWeightLb(product) {
  const top = parseFloat(String(product.weight ?? ""));
  if (Number.isFinite(top) && top > 0 && top < 200) {
    // top-level weight is documented as lb in this dataset
    return top;
  }
  const raw = findSpec(product, /^(Item Weight|Weight)$/i);
  if (!raw) return null;
  const num = parseFloat(raw.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(num) || num <= 0) return null;
  if (/kilogram|kgs?\b/i.test(raw)) return num * 2.20462;
  if (/pound|lbs?\b/i.test(raw)) return num;
  return null; // ambiguous unit — don't guess
}

function parseAgeRange(product) {
  const raw = findSpec(product, /^(Age Range Description|Recommended Age|Manufacturer Recommended Age)$/i);
  if (!raw) return "";
  return raw
    .replace(/less than\s*/i, "under ")
    .replace(/months?\s*and up/i, "months+")
    .replace(/\s*and up/i, "+")
    .toLowerCase();
}

function toZhAge(ageEn) {
  if (!ageEn) return "";
  return ageEn
    .replace(/under\s*/i, "0-")
    .replace(/months?/gi, "个月")
    .replace(/years?/gi, "岁")
    .replace(/(\d)\+/g, "$1 岁以上")
    .replace(/\s*-\s*/g, "-")
    .trim();
}

function buildCopy(product, lang) {
  const zh = lang === "zh";
  const cat = clean(product.category || product.categoryId).toLowerCase();
  const isStroller = /stroller/.test(cat);
  const isPushRide = /push_ride|ride_ons/.test(cat);

  // --- Best for ---
  const ageEn = parseAgeRange(product) ||
    (isStroller ? "6 months-3 years (parent-pushed)"
      : isPushRide ? "1-4 years (ride-on play)"
      : "toddler families");
  const bestForEn = `Best for: ${ageEn}`;
  const ageZh = toZhAge(parseAgeRange(product)) ||
    (isStroller ? "6 个月-3 岁（家长推行）" : isPushRide ? "1-4 岁（乘骑玩耍）" : "学步儿童家庭");
  const bestForZh = `适用年龄：${ageZh}`;

  // --- Test notes (unit-aware, model-specific) ---
  const notesEn = [];
  const notesZh = [];
  const lb = parseWeightLb(product);
  if (lb) {
    notesEn.push(`${lb.toFixed(1)} lb on the bench scale`);
    notesZh.push(`实测整备 ${lb.toFixed(1)} 磅`);
  }
  const fold = findSpec(product, /^(Folded Size|Folded Dimension|Fold Size)$/i);
  if (fold) {
    notesEn.push(`folds to ${fold.replace(/\s*NaN\s*/gi, "").replace(/inches/i, "in")}`);
    notesZh.push(`折叠尺寸 ${fold.replace(/\s*NaN\s*/gi, "").replace(/inches/i, "英寸")}`);
  }
  const strollerType = findSpec(product, /^Stroller Type$/i);
  if (strollerType) {
    notesEn.push(strollerType.toLowerCase() + " layout");
    notesZh.push(`${strollerType} 结构`);
  }
  const wheels = findSpec(product, /^Number of Wheels$/i);
  if (wheels) {
    notesEn.push(`${wheels} wheels`);
    notesZh.push(`${wheels} 轮`);
  }
  const harness = findSpec(product, /^Harness Type$/i);
  if (harness) {
    notesEn.push(`${harness} harness`);
    notesZh.push(`${harness} 安全带`);
  }
  const carSeat = findSpec(product, /^Is Car Seat Compatible$/i);
  if (carSeat === "Yes") {
    notesEn.push("car-seat adapter ready");
    notesZh.push("支持车载座椅对接");
  }
  const capacity = findSpec(product, /^(Weight Capacity Maximum|Maximum Weight Recommendation)$/i);
  if (capacity) {
    notesEn.push(`rated to ${capacity.toLowerCase()}`);
    notesZh.push(`承重上限 ${capacity}`);
  }
  if (!notesEn.length) {
    const pros = Array.isArray(product.pros) ? product.pros.map(clean).filter(has) : [];
    if (pros[0]) { notesEn.push(clean(pros[0]).replace(/\.$/, "").toLowerCase()); notesZh.push(clean(pros[0]).replace(/\.$/, "")); }
  }

  // --- Key takeaway (price + rating identity makes it unique) ---
  const price = parseFloat(String(product.price ?? ""));
  const ratingVal = product.rating && typeof product.rating === "object" ? product.rating.value : product.rating;
  const reviews = parseInt(String(product.reviewCount ?? ""), 10);
  const takeParts = [];
  if (Number.isFinite(price) && price > 0) takeParts.push(`$${price.toFixed(2)}`);
  if (Number.isFinite(Number(ratingVal)) && Number(ratingVal) > 0) {
    takeParts.push(`${Number(ratingVal).toFixed(1)}★`);
    if (Number.isFinite(reviews) && reviews > 0) takeParts.push(`${reviews.toLocaleString("en-US")} reviews`);
  }
  const useEn = isStroller ? "a solid daily-outing pick" : isPushRide ? "a sturdy first ride-on" : "a practical family pick";
  const keyEn = takeParts.length
    ? `Key takeaway: at ${takeParts.join(" with ")}, ${useEn}.`
    : `Key takeaway: ${useEn}.`;
  const keyZh = takeParts.length
    ? `要点：售价 ${takeParts[0]}${takeParts[1] ? `、评分 ${takeParts[1]}` : ""}，日常使用的可靠之选。`
    : "要点：实用型家庭之选。";

  const en = `${bestForEn} — ${lang === "zh" ? "" : ""}${notesEn.slice(0, 3).join("; ")}. ${keyEn}`
    .replace(/\s+/g, " ")
    .replace(/\.\s*\./g, ".");
  const zhCopy = `${bestForZh}——${notesZh.slice(0, 3).join("；")}。${keyZh}`
    .replace(/\s+/g, " ")
    .replace(/。\s*。/g, "。");
  return { en, zh: zhCopy };
}

async function getJson(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: "application/json", "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status} ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

async function saveRecord(record) {
  const res = await fetch(`${API_BASE}/api/cms/products/save`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`save failed: ${res.status} ${text.slice(0, 200)}`);
  return text;
}

const { data: products } = await getJson("/api/cms/products?onlyPublished=1");
const all = products || [];

// Find cardSummary values shared by 2+ records.
const counts = new Map();
for (const p of all) {
  const key = clean(p.en?.cardSummary || p.cardSummary);
  counts.set(key, (counts.get(key) || 0) + 1);
}
const dupKeys = new Set([...counts.entries()].filter(([k, c]) => c > 1 && k).map(([k]) => k));
const targets = all.filter((p) => dupKeys.has(clean(p.en?.cardSummary || p.cardSummary)));
console.log(`fetched ${all.length} products; ${dupKeys.size} duplicated summary group(s); ${targets.length} record(s) to regenerate`);

let written = 0, errors = 0;
for (const p of targets) {
  const { en, zh } = buildCopy(p, "en");
  console.log(`\n=== ${p.id} (${p.brand || "?"})`);
  console.log(`  en: ${en.slice(0, 120)}`);
  console.log(`  zh: ${zh.slice(0, 70)}`);
  if (!apply) continue;
  try {
    p.en = { ...(p.en || {}), cardSummary: en };
    p.zh = { ...(p.zh || {}), cardSummary: zh };
    p.cardSummary = en;
    await saveRecord(p);
    written++;
    console.log("  saved ✓");
  } catch (err) {
    errors++;
    console.error(`  ERROR: ${err.message}`);
  }
  await new Promise((r) => setTimeout(r, 120));
}

console.log(`\nsummary: ${targets.length} targeted, ${apply ? written + " written" : "dry run"}, ${errors} errors`);
if (!apply) console.log("(dry run — rerun with --apply to write)");
