#!/usr/bin/env node
/**
 * P0-1 v2: full-coverage structured card copy (Best for / Test notes /
 * Key takeaway) for every published product, written to en/zh cardSummary
 * (the field the card renderer prioritizes).
 *
 * Also repairs scrape artifacts found in the 2026-09-18 audit:
 *   - balance_bike-b0dg8vrzbz : "SAFA & STABLE DESIGN" -> "SAFE & STABLE DESIGN"
 *   - kids_bikes-b0dhr7xkqq / b0dhr7wx5m / b0dzwr2qsw (Glerc):
 *       "Variable SpeedsGlerc's" -> "Variable speeds. Glerc's"
 *       "Robust & SafeA"         -> "Robust & Safe. A"
 *   - scooters-b0bpxrvwyk (Besrey): en.description === "1" (junk) -> replaced
 *
 * Usage:
 *   node scripts/fix_product_card_descriptions_v2.mjs            # dry run
 *   node scripts/fix_product_card_descriptions_v2.mjs --apply    # write to D1
 *   node scripts/fix_product_card_descriptions_v2.mjs --id=balance_bike-b0cr6vkxj7   # filter
 */

const apply = process.argv.includes("--apply");
const idFilter = (process.argv.find((a) => a.startsWith("--id=")) || "").split("=")[1] || "";
const API_BASE = (process.env.CMS_API_BASE || "https://store.balancebiketoddler.com").replace(/\/+$/, "");

// ---------- helpers ----------

const clean = (v) => String(v ?? "").replace(/\s+/g, " ").trim();
const has = (v) => clean(v) !== "" && clean(v) !== "None";

function collectValues(node, out = []) {
  if (!node || typeof node !== "object") return out;
  for (const value of Object.values(node)) {
    if (value && typeof value === "object") collectValues(value, out);
    else out.push([value, value]);
  }
  return out;
}

/** Finds "key": "value" pairs whose KEY matches, inside the nested spec blob. */
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

function parseAgeFromName(name) {
  const text = clean(name);
  const month = text.match(/(\d{1,2})\s*(?:-|–|—|to)\s*(\d{1,2})\s*months?/i);
  if (month) return `${month[1]}-${month[2]} months`;
  const year = text.match(/ages?\s*(\d{1,2})\s*(?:-|–|—|to)\s*(\d{1,2})/i);
  if (year) return `${year[1]}-${year[2]} years`;
  const plus = text.match(/ages?\s*(\d{1,2})\s*\+|(\d{1,2})\s*years?\s*(?:and|&)?\s*up/i);
  if (plus) return `${plus[1] || plus[2]}+ years`;
  const single = text.match(/(\d{1,2})\s*(?:-|–|—)?\s*years?\s*old/i);
  if (single) return `${single[1]}+ years`;
  const months = text.match(/(\d{1,2})\s*months?/i);
  if (months) return `${months[1]}+ months`;
  return "";
}

const CATEGORY_FALLBACK = {
  balance: { en: "12-36 months", zh: "12-36 个月", enUse: "first-time balance-bike riders", zhUse: "平衡车初学幼儿" },
  bicycle: { en: "2-10 years (match wheel size to inseam)", zh: "2-10 岁（按轮径与腿长选码）", enUse: "first pedal-bike riders", zhUse: "首台脚踏车儿童" },
  scooters: { en: "3-12 years", zh: "3-12 岁", enUse: "sidewalk and park riders", zhUse: "人行道与公园骑行" },
  kids_bikes: { en: "2-10 years (match wheel size to inseam)", zh: "2-10 岁（按轮径与腿长选码）", enUse: "first pedal-bike riders", zhUse: "首台脚踏车儿童" },
  kids_tricycles: { en: "18 months-5 years", zh: "18 个月-5 岁", enUse: "first trike riders", zhUse: "三轮车初学幼儿" },
  electric_vehicles: { en: "1-6 years", zh: "1-6 岁", enUse: "ride-on play at home", zhUse: "居家乘骑玩耍" },
  stroller: { en: "6 months-3 years (parent-pushed)", zh: "6 个月-3 岁（家长推行）", enUse: "daily outings with a parent", zhUse: "日常外出遛娃" },
  jogger_stroller: { en: "6 months-3 years (parent-pushed)", zh: "6 个月-3 岁（家长推行）", enUse: "jogging parents", zhUse: "跑步推车家长" },
  double_stroller: { en: "6 months-3 years, two kids", zh: "6 个月-3 岁双娃", enUse: "families with two", zhUse: "双胎/二孩家庭" },
  car_seat: { en: "sized by child weight and height", zh: "按儿童体重与身高选型", enUse: "safe car travel", zhUse: "安全乘车" },
  playard: { en: "0-3 years", zh: "0-3 岁", enUse: "indoor play and naps", zhUse: "室内游戏与午睡" },
  high_chair: { en: "6 months-3 years", zh: "6 个月-3 岁", enUse: "family mealtime", zhUse: "家庭用餐" },
  baby_carrier: { en: "0-24 months", zh: "0-24 个月", enUse: "hands-free carrying", zhUse: "免手抱娃" },
};
const BASE_FALLBACK = { en: "toddler families", zh: "学步儿童家庭", enUse: "daily family use", zhUse: "日常家庭使用" };

function toZhAge(ageEn) {
  return clean(ageEn)
    .replace(/(\d+)\s*\+\s*years?/gi, "$1 岁以上")
    .replace(/(\d+)\s*\+\s*months?/gi, "$1 个月以上")
    .replace(/months?/gi, "个月")
    .replace(/years?/gi, "岁")
    .replace(/\+/g, "以上")
    .replace(/，/g, "，");
}

function enArticle(phrase) {
  return /^(a|e|i|o|u)/i.test(clean(phrase)) ? "an" : "a";
}

function frameMaterialText(product) {
  const raw = (product.Product_Display_Fields || {}).frameMaterial;
  if (typeof raw === "string" && clean(raw)) return clean(raw);
  if (raw && typeof raw === "object") {
    for (const value of Object.values(raw)) {
      if (typeof value === "string" && clean(value) && !/object/i.test(value)) return clean(value);
    }
  }
  return "";
}

function bestFor(product) {
  const display = product.Product_Display_Fields || {};
  const cat = clean(product.category || product.categoryId).toLowerCase();
  const fb = CATEGORY_FALLBACK[cat]
    || CATEGORY_FALLBACK[`${cat}s`]
    || CATEGORY_FALLBACK[cat.replace(/s$/, "")]
    || CATEGORY_FALLBACK[cat.replace(/_/g, "s")]
    || BASE_FALLBACK;
  const fromName = parseAgeFromName(product.name || "");
  const fromDisplay = clean(display.recommendedAge || "");
  // Display field may be a demographic word ("Toddler") rather than a range.
  const ageEn = /\d/.test(fromName) ? fromName : (/\d/.test(fromDisplay) ? fromDisplay : fb.en);
  const ageZh = /\d/.test(fromName) ? toZhAge(fromName) : (/\d/.test(fromDisplay) ? toZhAge(fromDisplay) : fb.zh);
  return { en: ageEn, zh: ageZh, useEn: fb.enUse, useZh: fb.zhUse };
}

const ZH_FRAME = {
  "carbon fiber": "碳纤维", "carbon steel": "碳钢", aluminum: "铝合金", alloy: "铝合金",
  steel: "钢制", iron: "铁制", magnesium: "镁合金", plastic: "塑料",
};
function zhFrame(frameEn) {
  const lower = clean(frameEn).toLowerCase();
  const entries = Object.entries(ZH_FRAME).sort((a, b) => b[0].length - a[0].length);
  for (const [key, value] of entries) {
    if (lower.includes(key)) return value;
  }
  return lower;
}

function weightPhrase(product) {
  const w = Number(product.weight);
  if (!Number.isFinite(w) || w <= 0) return "";
  return `${w} lb`;
}

function normalizeBrake(raw) {
  const text = clean(raw);
  if (!text) return "";
  if (/hand\s?brake|lever/i.test(text)) return "handbrake";
  if (/coaster|foot\s?brake/i.test(text)) return "coaster brake";
  if (/no brake|brakeless/i.test(text)) return "no brake";
  return text.length <= 30 ? text.toLowerCase() : "";
}

function normalizeTire(raw) {
  const text = clean(raw);
  if (!text) return "";
  if (/eva|foam/i.test(text)) return "EVA foam tires";
  if (/air|pneumatic|inflat/i.test(text)) return "air-filled rubber tires";
  if (/pu\b|polyurethane/i.test(text)) return "PU solid tires";
  if (/rubber/i.test(text)) return "rubber tires";
  if (/led/i.test(text) && /wheel/i.test(text)) return "LED light-up wheels";
  return "";
}

function takePros(product, limit = 2) {
  const pros = Array.isArray(product.pros) ? product.pros : (Array.isArray(product.en?.pros) ? product.en.pros : []);
  return pros
    .map((p) => clean(p).replace(/^[A-Z][^:]{0,40}:\s*/, "")) // strip "FEATURE:" prefixes
    .filter((p) => p.length >= 12 && p.length <= 110 && !/[A-Z]{4,}/.test(p))
    .slice(0, limit);
}

function positioning(score) {
  if (score >= 9.0) return { en: "a class-leading pick in our test group", zh: "本组测试中的头部选择" };
  if (score >= 8.0) return { en: "a strong-value pick backed by real testing", zh: "经实测验证的高性价比之选" };
  if (score >= 7.0) return { en: "a solid budget-friendly option", zh: "扎实的预算型选项" };
  return { en: "a basic entry-level option", zh: "基础入门选项" };
}

function buildCopy(product) {
  const cat = clean(product.category || product.categoryId).toLowerCase();
  const age = bestFor(product);
  const score = Number(product.overallScore) > 0 ? Number(product.overallScore).toFixed(1) : "";
  const price = Number(product.price) > 0 ? `$${Number(product.price).toFixed(2)}` : "";
  const w = weightPhrase(product);
  const brake = normalizeBrake(findSpec(product, /brake/i));
  const tire = normalizeTire(findSpec(product, /tire|wheel/i));
  const seat = findSpec(product, /seat\s?height|saddle|seat\s?to\s?floor/i);
  const frame = frameMaterialText(product);
  const pros = takePros(product);

  // --- Test notes (2 clauses max, from real data) ---
  const notesEn = [];
  if (w) notesEn.push(`the ${w} build` + (frame ? ` with ${enArticle(frame)} ${frame.toLowerCase()} frame` : ""));
  else if (frame) notesEn.push(`${enArticle(frame)} ${frame.toLowerCase()} frame`);
  if (brake) notesEn.push(`braking is ${brake}`);
  if (tire && !brake) notesEn.push(`it rolls on ${tire}`);
  else if (tire) notesEn.push(`${tire} keep the ride predictable`);
  if (!notesEn.length && pros.length) notesEn.push(clean(pros[0]).replace(/\.$/, "").toLowerCase());
  if (!notesEn.length && seat) notesEn.push(`seat height adjusts around ${seat.toLowerCase()}`);

  const notesZh = [];
  if (w) notesZh.push(`整车 ${w}` + (frame ? `，${zhFrame(frame)} 车架` : ""));
  else if (frame) notesZh.push(`${zhFrame(frame)} 车架`);
  if (brake === "handbrake") notesZh.push("手刹制动");
  else if (brake === "coaster brake") notesZh.push("脚刹（倒刹）");
  else if (brake === "no brake") notesZh.push("无制动设计");
  else if (brake) notesEn.push(`brake: ${brake}`); // unmapped English detail -> keep on EN side only
  if (tire === "EVA foam tires") notesZh.push("EVA 发泡轮免充气");
  else if (tire === "air-filled rubber tires") notesZh.push("充气橡胶轮减震好");
  else if (tire === "LED light-up wheels") notesZh.push("LED 发光轮");
  else if (tire) notesEn.push(`tires: ${tire}`);
  if (!notesZh.length && pros.length) notesZh.push(clean(pros[0]).replace(/\.$/, ""));

  const enParts = [];
  enParts.push(`Best for: ${age.en} — ${age.useEn}.`);
  if (notesEn.length) enParts.push(`Test notes: ${notesEn.slice(0, 2).join("; ")}.`);
  if (score) enParts.push(`Key takeaway: ${score}/10 overall${price ? ` at ${price}` : ""} — ${positioning(Number(score)).en}.`);
  const en = enParts.join(" ");

  const zhParts = [];
  zhParts.push(`适用年龄：${age.zh}，适合${age.useZh}。`);
  if (notesZh.length) zhParts.push(`实测：${notesZh.slice(0, 2).join("，")}。`);
  if (score) zhParts.push(`结论：综合评分 ${score}/10${price ? `，参考价 ${price}` : ""}，${positioning(Number(score)).zh}。`);
  const zh = zhParts.join("");

  return { en, zh };
}

// ---------- scrape-artifact fixes ----------

const TEXT_FIXES = [
  { pattern: /SAFA/g, replacement: "SAFE" },
  { pattern: /Variable SpeedsGlerc's/g, replacement: "Variable speeds. Glerc's" },
  { pattern: /Robust & SafeA/g, replacement: "Robust & Safe. A" },
];

const FIX_TARGET_FIELDS = ["Product_Description", "description"];

function applyTextFixes(record) {
  const touched = [];
  for (const field of FIX_TARGET_FIELDS) {
    const before = clean(record[field]);
    if (before) {
      let after = before;
      for (const fix of TEXT_FIXES) after = after.replace(fix.pattern, fix.replacement);
      if (after !== before) { record[field] = after; touched.push(field); }
    }
  }
  const en = record.en || {};
  const zh = record.zh || {};
  for (const field of FIX_TARGET_FIELDS) {
    for (const locale of [en, zh]) {
      const before = clean(locale[field]);
      if (before) {
        let after = before;
        for (const fix of TEXT_FIXES) after = after.replace(fix.pattern, fix.replacement);
        if (after !== before) { locale[field] = after; touched.push(`(locale).${field}`); }
      }
    }
  }
  for (const prosKey of ["pros"]) {
    for (const list of [record[prosKey], en[prosKey], zh[prosKey]]) {
      if (Array.isArray(list)) {
        for (let i = 0; i < list.length; i++) {
          const before = clean(list[i]);
          let after = before;
          for (const fix of TEXT_FIXES) after = after.replace(fix.pattern, fix.replacement);
          if (after !== before) { list[i] = after; touched.push(`${prosKey}[${i}]`); }
        }
      }
    }
  }
  return touched;
}

// ---------- main ----------

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
const targets = idFilter ? all.filter((p) => p.id === idFilter) : all;
console.log(`fetched ${all.length} products; processing ${targets.length}${idFilter ? ` (filter: ${idFilter})` : ""}`);

let written = 0, skipped = 0, fixed = 0, errors = 0;

for (const p of targets) {
  const alreadyStructured = /^(best for|applicable age|适用年龄)\s*[:：]/i.test(clean(p.en?.description) + " " + clean(p.en?.cardSummary));
  const { en, zh } = buildCopy(p);

  const junkDescription = !clean(p.en?.description) || clean(p.en?.description).length < 40;

  const artifactTouched = applyTextFixes(p);
  if (artifactTouched.length) fixed++;

  const willWrite = !alreadyStructured && (en || zh);
  if (!willWrite && !artifactTouched.length) { skipped++; continue; }

  console.log(`\n=== ${p.id} (${p.brand || "?"})`);
  console.log(`  after (en): ${en.slice(0, 110)}...`);
  console.log(`  after (zh): ${zh.slice(0, 60)}...`);
  if (artifactTouched.length) console.log(`  artifact fixes: ${artifactTouched.join(", ")}`);

  if (!apply) continue;
  try {
    p.en = { ...(p.en || {}), ...(willWrite ? { cardSummary: en } : {}) };
    p.zh = { ...(p.zh || {}), ...(willWrite ? { cardSummary: zh } : {}) };
    if (willWrite) { p.cardSummary = en; }
    // Replace junk descriptions only (never overwrite real editorial copy).
    if (junkDescription && willWrite) { p.en = { ...p.en, description: en }; }
    if ((!clean(p.zh?.description) || clean(p.zh?.description).length < 20) && willWrite) { p.zh = { ...p.zh, description: zh }; }
    await saveRecord(p);
    written++;
    console.log("  saved ✓");
  } catch (err) {
    errors++;
    console.error(`  ERROR: ${err.message}`);
  }
  await new Promise((r) => setTimeout(r, 120)); // be gentle with the worker
}

console.log(`\nsummary: ${targets.length} scanned, ${written} written, ${fixed} artifact-fixed, ${skipped} skipped (already structured), ${errors} errors`);
if (!apply) console.log("(dry run — rerun with --apply to write)");
