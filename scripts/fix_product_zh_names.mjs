#!/usr/bin/env node
/**
 * Regenerate concise Chinese display names for CMS products.
 *
 * The bulk import wrote zh.name as "<full Amazon title> <category suffix>"
 * (195 of 197 products) — a lazy pseudo-translation that still reads as an
 * English wall on Chinese pages. This script rebuilds those names from
 * structured fields:
 *
 *     SEREED 幼儿平衡车（2-5 岁，无脚踏）
 *     Retrospec Cricket 幼儿平衡车（1-2 岁）
 *     Graco 旅行推车（可折叠）
 *
 * Rules:
 *   - brand stays as-is (brand names are not translated)
 *   - category follows the id namespace (the project's authoritative signal;
 *     the categoryId field disagrees on 40 products)
 *   - subcategory label from the curated glossary rules (幼儿平衡车/旅行推车/…)
 *   - age range parsed from the title ("12-24 Months" -> 1-2 岁)
 *   - up to two category-appropriate feature tags (无脚踏 / 带辅助轮 / 可折叠 …)
 *   - genuine Chinese names (CJK-dominant) are NEVER touched
 *   - only zh.name is written; every other field round-trips unchanged
 *
 * Usage:
 *   node scripts/fix_product_zh_names.mjs            # dry run, print plan
 *   node scripts/fix_product_zh_names.mjs --write    # apply via CMS API
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const GLOSSARY = JSON.parse(
  readFileSync(path.join(SCRIPT_DIR, "config/product_zh_glossary.v1.json"), "utf8"),
);

const CMS_BASE = "https://store.balancebiketoddler.com";
const ADMIN_TOKEN = process.env.CMS_ADMIN_ALL_TOKEN || readEnvToken();
const MAX_NAME_CHARS = 36;

function readEnvToken() {
  try {
    const raw = readFileSync(path.join(SCRIPT_DIR, "..", ".env.local"), "utf8");
    const m = raw.match(/^CMS_ADMIN_ALL_TOKEN=(.+)$/m);
    return m ? m[1].trim() : "";
  } catch {
    return "";
  }
}

// --- taxonomy ---------------------------------------------------------------

const KNOWN_CATEGORY_IDS = new Set(Object.keys(GLOSSARY.categories));

/** id namespace wins: categoryId disagrees with the id prefix on 40 products. */
function resolveCategory(product) {
  const prefix = String(product.id || "").split("-")[0].toLowerCase();
  if (KNOWN_CATEGORY_IDS.has(prefix)) return prefix;
  const field = String(product.categoryId || product.category || "").toLowerCase();
  return KNOWN_CATEGORY_IDS.has(field) ? field : "other";
}

const SUBCATEGORY_RULES = [
  { key: "jogging_stroller", categoryId: "stroller", test: /(jogging|jogger|all[- ]terrain)/i },
  { key: "travel_stroller", categoryId: "stroller", test: /(travel\s*stroller|umbrella|compact|carry[- ]on|airplane)/i },
  { key: "lightweight_stroller", categoryId: "stroller", test: /(lightweight|light weight)/i },
  { key: "double_stroller", categoryId: "stroller", test: /(double|twin|duo)/i },
  { key: "full_size_stroller", categoryId: "stroller", test: /(full[- ]size|modular|travel system)/i },
  { key: "toddler_balance_bike", categoryId: "balance_bike", test: /(balance\s*bike|toddler\s*bike|push\s*handle|\d\s*in\s*1)/i },
  { key: "kids_pedal_bike", categoryId: "kids_bikes", test: /(kids?\s*bike|bicycle|pedal|bmx|cruiser)/i },
  { key: "kids_kick_scooter", categoryId: "scooters", test: /(scooter|kick)/i },
  { key: "ride_on_car", categoryId: "electric_vehicles", test: /(ride[- ]on|electric|vehicle|battery|volt)/i },
  { key: "convertible_car_seat", categoryId: "car_seat", test: /(convertible|infant|booster|car\s*seat)/i },
  { key: "baby_carrier_wrap", categoryId: "baby_carrier", test: /(carrier|wrap|sling|hip\s*seat)/i },
  { key: "portable_playard", categoryId: "playard", test: /(playard|play\s*yard|pack[' ]?n\s*play|nursery\s*center)/i },
  { key: "convertible_high_chair", categoryId: "high_chair", test: /(high\s*chair|highchair|feeding\s*chair|booster|2[- ]in[- ]1|3[- ]in[- ]1|4[- ]in[- ]1)/i },
  { key: "push_ride_on", categoryId: "kids_push_ride_ons", test: /(push\s*handle|push\s*ride[- ]on|ride[- ]on\s*toy|push\s*car)/i },
  { key: "tricycle", categoryId: "kids_tricycles", test: /(tricycle|trike|tri[- ]cycle)/i },
];

// Products the source data miscategorized (baby swings parked under stroller,
// say). Text rules run before the category fallback so the label matches what
// the product actually is.
const EXTRA_TEXT_RULES = [
  { test: /(baby|infant)\s*swing/i, zh: "婴儿秋千" },
  { test: /bouncer|rocker/i, zh: "婴儿摇椅" },
  { test: /walker\s*car|baby\s*walker/i, zh: "婴儿学步车" },
];

// --- feature tags (category-gated, max two, priority order) -----------------

const TAG_LIBRARY = {
  no_pedal: { test: /no[-\s]?pedals?|without pedals?|pedal[-\s]?less|pedalless/i, zh: "无脚踏" },
  training_wheels: { test: /training wheels?/i, zh: "带辅助轮" },
  foldable: { test: /foldable|folding|easy fold|one[- ]hand(ed)? fold|compact fold/i, zh: "可折叠" },
  seat_adjustable: { test: /adjustable (seat|saddle|handlebar|height)|height adjustable/i, zh: "座高可调" },
  recline: { test: /reclin(e|ing)|lay flat|lie flat/i, zh: "可躺" },
  push_handle: { test: /push (handle|bar|guide)/i, zh: "带推杆" },
  storage_basket: { test: /storage basket|under[- ]seat storage/i, zh: "带置物篮" },
  convertible: { test: /convertible|\d[- ]in[- ]1/i, zh: "可转换" },
  remote_control: { test: /remote control|parent control/i, zh: "可遥控" },
};

const TAGS_BY_CATEGORY = {
  balance_bike: ["no_pedal", "training_wheels", "foldable", "seat_adjustable"],
  kids_bikes: ["training_wheels", "foldable", "seat_adjustable"],
  scooters: ["foldable", "seat_adjustable"],
  kids_tricycles: ["push_handle", "foldable", "seat_adjustable"],
  kids_push_ride_ons: ["foldable", "push_handle"],
  stroller: ["foldable", "recline", "storage_basket"],
  high_chair: ["foldable", "recline", "seat_adjustable"],
  car_seat: ["convertible", "recline"],
  electric_vehicles: ["remote_control"],
};

// --- model extraction -------------------------------------------------------

const MODEL_NOISE =
  /\b(?:kids?|children|child|toddlers?|baby|babies|infant|infants|jogging|jogger|travel|double|foldable|folding|lightweight|ultra|portable|compact|stroller|balance|bike|bicycle|scooter|tricycle|electric|vehicle|car|seat|carrier|chair|high|wheels?|handle|push|walker|swings?|ride|toy|toys|gift|gifts|boy|boys|girl|girls|old|olds|year|years|month|months|age|ages|first|birthday|and|with|for|of|the|on|new|best|inch|inches|in|mode|style|pro|max|mini|plus|convert|converts|convertible|feeding|tabletalk|grow|eat|lbs?|air|carbon|fiber|frame|playset|coaster|roller|down|up|colorful|lighting|glow|music|sound|sounds|pop|star|white|black|pink|blue|green|gray|grey|beige|taupe|onyx|mint|twin|duo|venture|swing|side|by|all|terrain)\b/gi;

/** Brands the import derived from generic title words — not real brands. */
const GENERIC_BRANDS = new Set([
  "baby", "babies", "kids", "kid", "toddler", "toddlers", "infant", "infants",
  "child", "children", "toy", "toys", "new", "best", "the", "for", "with",
  "foldable", "folding", "portable", "lightweight", "compact", "adjustable",
  "removable", "detachable", "convertible", "stroller", "balance", "bike",
  "bicycle", "scooter", "electric", "ride", "car", "seat", "swing", "walker",
  "carrier", "chair", "high", "feeding", "travel", "jogging", "double",
  "trike", "tricycle", "cruiser", "bmx", "pedal", "wheels", "handle", "push",
  "colorful", "lighting",
]);

function normalize(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function countCjk(text) {
  return (String(text || "").match(/[\u4e00-\u9fff]/g) || []).length;
}
function countLetters(text) {
  return (String(text || "").match(/[A-Za-z]/g) || []).length;
}

/** English-dominant zh.name = the lazy "<english title> <suffix>" pseudo-translation. */
function needsRegeneration(zhName) {
  const value = normalize(zhName);
  if (!value) return true;
  const cjk = countCjk(value);
  const letters = countLetters(value);
  return letters > cjk * 2 || cjk < 6;
}

function modelOf(product) {
  const brand = normalize(product.brand || product.en?.brandText || product.zh?.brandText);
  let text = normalize(product.en?.name || product.name || product.zh?.name);
  if (brand && text.toLowerCase().startsWith(brand.toLowerCase())) text = text.slice(brand.length).trim();
  // Parentheticals are colorways/specs ("(Pop Star White)"), never the model.
  text = text.replace(/\([^)]*\)/g, " ").split(/[,;|]|\s[-–—]\s/)[0].trim();
  const tokens = text
    .replace(MODEL_NOISE, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((t) => t.replace(/^[^A-Za-z]+|[^A-Za-z-]+$/g, ""))
    .filter((t) => t && /^[A-Z][A-Za-z-]{2,11}$/.test(t)) // capitalized word, no digits/ASINs
    .slice(0, 2);
  const model = tokens.join(" ");
  return model.length <= 14 ? model : tokens.slice(0, 1).join(" ");
}

// --- age parsing ------------------------------------------------------------

function fmtAge(n, unit) {
  if (unit === "m") {
    if (n === 18) return "1.5 岁";
    if (n < 24) return `${n} 个月`;
    return Number.isInteger(n / 12) ? `${n / 12} 岁` : `${Math.round((n / 12) * 10) / 10} 岁`;
  }
  return `${n} 岁`;
}

/** "12-24 months" -> 1-2 岁; "10-36 months" -> 10 个月-3 岁; "1-3 years" -> 1-3 岁. */
function rangeLabel(a, unitA, b, unitB) {
  const aIsYear = unitA === "y" || (unitA === "m" && a >= 24);
  const bIsYear = unitB === "y" || (unitB === "m" && b >= 24);
  if (aIsYear && bIsYear) {
    const ay = unitA === "m" ? Math.round((a / 12) * 10) / 10 : a;
    const by = unitB === "m" ? Math.round((b / 12) * 10) / 10 : b;
    return `${ay}-${by} 岁`;
  }
  return `${fmtAge(a, unitA)}-${fmtAge(b, unitB)}`;
}

function ageLabelOf(title) {
  const head = title.slice(0, 120);
  const num = "(\\d{1,2}(?:\\.\\d)?)";
  const sep = "\\s*(?:[-–—]|to)\\s*";
  const unitM = "(months?|mos?)\\b";
  const unitY = "(years?|yrs?)\\b";

  let m = head.match(new RegExp(`${num}${sep}${num}\\s*${unitM}`, "i"));
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a < 24 && b < 24) return `${a}-${b} 个月`;
    return rangeLabel(a, "m", b, "m");
  }
  m = head.match(new RegExp(`${num}\\s*${unitM}${sep}${num}\\s*${unitY}`, "i"));
  if (m) return rangeLabel(Number(m[1]), "m", Number(m[3]), "y");
  m = head.match(new RegExp(`${num}${sep}${num}\\s*${unitY}`, "i"));
  if (m) return rangeLabel(Number(m[1]), "y", Number(m[2]), "y");
  m = head.match(new RegExp(`${num}\\s*${unitY}\\s*old`, "i"));
  if (m) return fmtAge(Number(m[1]), "y");
  m = head.match(new RegExp(`${num}\\s*${unitM}\\s*old`, "i"));
  if (m) return fmtAge(Number(m[1]), "m");
  m = head.match(new RegExp(`ages?\\s*${num}\\s*${unitY}`, "i"));
  if (m) return fmtAge(Number(m[1]), "y");
  m = head.match(new RegExp(`ages?\\s*${num}\\s*${unitM}`, "i"));
  if (m) return fmtAge(Number(m[1]), "m");
  m = head.match(new RegExp(`for\\s*${num}\\s*${unitY}`, "i"));
  if (m) return fmtAge(Number(m[1]), "y");
  return "";
}

// --- assembly ---------------------------------------------------------------

function buildZhName(product) {
  const title = normalize(product.en?.name || product.name || product.zh?.name || "");
  const description = normalize(product.en?.description || product.description || "");
  const features = Array.isArray(product.features) ? product.features.join(" ") : "";
  const sourceText = `${title} ${description} ${features}`;
  const category = resolveCategory(product);

  const rawBrand = normalize(product.brand || "");
  const brand = GENERIC_BRANDS.has(rawBrand.toLowerCase()) ? "" : rawBrand;
  const model = modelOf(product);
  const age = ageLabelOf(title);

  let subcat = "";
  for (const rule of SUBCATEGORY_RULES) {
    if (rule.categoryId !== category) continue;
    if (rule.test.test(sourceText)) {
      subcat = GLOSSARY.subcategories?.[rule.key]?.zh || "";
      if (subcat) break;
    }
  }
  if (!subcat) {
    for (const rule of EXTRA_TEXT_RULES) {
      if (rule.test.test(sourceText)) {
        subcat = rule.zh;
        break;
      }
    }
  }
  if (!subcat) subcat = GLOSSARY.categories[category] || "童车";

  const allowedTags = TAGS_BY_CATEGORY[category] || [];
  const tags = allowedTags
    .map((key) => TAG_LIBRARY[key])
    .filter((tag) => tag && tag.test.test(sourceText))
    .map((tag) => tag.zh)
    .slice(0, 2);

  const details = [age, ...tags].filter(Boolean).join("，");
  let name = [brand, model, subcat].filter(Boolean).join(" ");
  if (details) name += `（${details}）`;

  if (name.length > MAX_NAME_CHARS) {
    name = [brand, subcat].filter(Boolean).join(" ");
    if (age && name.length + age.length + 3 <= MAX_NAME_CHARS) name += `（${age}）`;
  }
  return normalize(name);
}

// --- main -------------------------------------------------------------------

async function main() {
  const write = process.argv.includes("--write");
  const res = await fetch(`${CMS_BASE}/api/cms/products`);
  if (!res.ok) throw new Error(`GET products failed: ${res.status}`);
  const json = await res.json();
  const products = json?.data || [];
  console.log(`products: ${products.length}${write ? " (WRITE MODE)" : " (dry run)"}`);

  const plan = [];
  let kept = 0;
  for (const product of products) {
    const current = normalize(product.zh?.name || "");
    if (!needsRegeneration(current)) {
      kept += 1;
      continue;
    }
    const next = buildZhName(product);
    if (!next) {
      console.log(`  SKIP (cannot build): ${product.id}`);
      continue;
    }
    plan.push({ product, current, next });
  }

  console.log(`keep (already Chinese): ${kept}`);
  console.log(`regeneration plan: ${plan.length} product(s)`);
  for (const item of plan.slice(0, 400)) {
    console.log(`  ${item.product.id}`);
    console.log(`    - ${item.current.slice(0, 80)}`);
    console.log(`    + ${item.next}`);
  }
  if (plan.length > 400) console.log(`  … and ${plan.length - 30} more`);

  // sanity: every generated name must carry a real Chinese label
  const noChinese = plan.filter((p) => countCjk(p.next) < 2);
  if (noChinese.length) {
    console.log(`\nWARNING: ${noChinese.length} generated name(s) without a Chinese label:`);
    for (const p of noChinese.slice(0, 10)) console.log(`  ${p.product.id}: ${p.next}`);
  }

  if (!write) {
    console.log("\ndry run — pass --write to apply.");
    return;
  }
  if (!ADMIN_TOKEN) {
    console.error("CMS_ADMIN_ALL_TOKEN missing (env or front/.env.local) — aborting.");
    process.exit(1);
  }

  let ok = 0;
  let failed = 0;
  for (const { product, next } of plan) {
    const payload = { ...product, zh: { ...(product.zh || {}), name: next } };
    try {
      const save = await fetch(`${CMS_BASE}/api/cms/products/save`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-cms-admin-token": ADMIN_TOKEN,
        },
        body: JSON.stringify(payload),
      });
      if (!save.ok) {
        failed += 1;
        console.error(`  FAIL ${product.id}: ${save.status} ${(await save.text()).slice(0, 120)}`);
      } else {
        ok += 1;
        if (ok % 25 === 0) console.log(`  … ${ok} saved`);
      }
    } catch (err) {
      failed += 1;
      console.error(`  FAIL ${product.id}: ${err.message}`);
    }
  }
  console.log(`\ndone: ${ok} saved, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
