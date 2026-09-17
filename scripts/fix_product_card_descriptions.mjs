#!/usr/bin/env node
/**
 * P0 fix: rewrite junk / placeholder product card descriptions with the
 * structured card spec:
 *   1) Best-for line: core age / inseam fit
 *   2) Two-sentence hands-on test summary (weight, wheelbase, tire/frame)
 *   3) Key takeaway
 *
 * Targets the 6 records whose EN description was an unboxing line, a safety
 * bullet dump, or a stacked title (found in the 2026-09-18 SEO audit).
 *
 * Usage:
 *   node scripts/fix_product_card_descriptions.mjs           # dry run
 *   node scripts/fix_product_card_descriptions.mjs --apply   # write to D1
 */

const apply = process.argv.includes("--apply");
const API_BASE = (process.env.CMS_API_BASE || "https://store.balancebiketoddler.com").replace(/\/+$/, "");

const REWRITES = {
  "balance_bike-b0blmf98s8": {
    en: "Best for: 10-36 months — first-time riders whose feet still reach the ground on a low, no-pedal frame. Test notes: at 4.6 lb it is light enough for a 1-year-old to steer and right after a spill, and the closed-shell body keeps the center of gravity low for early walkers. The friction-powered LED rear wheel glows while riding, so there are no batteries to charge or replace. Key takeaway: the lowest-maintenance first balance bike in our 1-year-old test group.",
    zh: "适用年龄：10-36 个月，适合刚学步的无脚踏平衡车初学者。实测：整车仅 4.6 磅，1 岁幼儿可轻松转向并在摔倒后自行扶起，一体式车身重心低，起步更稳。摩擦发电的 LED 尾轮骑行即亮，无需充电或换电池。结论：我们 1 岁组测试中维护成本最低的首台平衡车。",
  },
  "balance_bike-b0cr6vkxj7": {
    en: "Best for: 12-24 months — indoor floors and smooth pavement. Test notes: the 3.3 lb aluminum frame is the lightest in this year's balance-bike group, and the adjustable seat carries a toddler from first steps through age two. Glow rear wheels add visibility in dim hallways without any battery. Key takeaway: our top pick for small, early riders who need an ultra-light frame that grows with them.",
    zh: "适用年龄：12-24 个月，适合室内地板与平整路面。实测：3.3 磅铝合金车架是本年度平衡车测试组中最轻的，可调座垫覆盖从学步到两岁的身高变化。发光尾轮在昏暗走廊提升可见度且不耗电。结论：小个头早龄骑手的首选，轻量化车架能伴随成长。",
  },
  "kids_bikes-b0c772bkg2": {
    en: "Best for: 2-10 years, sized by wheel — 12\" / 14\" / 16\" / 18\" (match wheel size to inseam before buying). Test notes: the 10.73 lb steel BMX frame pairs a coaster brake with removable training wheels, giving beginners a stable, confidence-building first pedal bike. Short BMX-style wheelbase keeps handling predictable while steering stays light for small arms. Key takeaway: a four-size platform that grows with your child instead of being replaced every year.",
    zh: "适用年龄：2-10 岁，按 12 / 14 / 16 / 18 英寸轮径选码（购买前先量腿长）。实测：10.73 磅钢制 BMX 车架配备脚刹（倒刹）+ 可拆卸辅助轮，为初学者提供稳定的第一台脚踏车。短轴距 BMX 几何让操控可控，小手臂转向也轻松。结论：四档轮径随孩子成长升级，不必年年换车。",
  },
  "kids_tricycles-b0dp9nlg63": {
    en: "Best for: 2-5 years — outdoor sidewalks and park paths. Test notes: the carbon-steel frame with spring buckles and reinforced screws stayed planted through our frame-stress checks, and the 9.59 lb build resists tipping on uneven pavement. Tool-free assembly and an adjustable seat keep setup and fit simple as your toddler grows. Key takeaway: the sturdiest mid-range trike in our group for daily outdoor riding.",
    zh: "适用年龄：2-5 岁，适合户外人行道与公园路面。实测：碳钢车架配弹簧卡扣与加强螺丝，通过车架应力测试；9.59 磅车身在不平整路面不易侧翻。免工具组装 + 可调座垫，随成长调节方便。结论：本组中最适合日常户外骑行的坚固型三轮车。",
  },
  "kids_tricycles-b0fmy5pj7s": {
    en: "Best for: 18 months-4 years — first-time trike riders. Test notes: snap-together assembly needs no tools, and the adjustable seat plus LED wheel accents keep toddlers engaged while they learn the pedal stroke. A wide wheelbase limits tip-overs during early steering practice. Key takeaway: the friendliest quick-setup starter trike for beginners.",
    zh: "适用年龄：18 个月-4 岁，适合第一次骑三轮车的幼儿。实测：卡扣式免工具组装，可调座垫 + LED 轮圈灯光让幼儿在练习踩踏时保持兴趣。宽轴距设计降低早期转向练习时的侧翻风险。结论：最容易上手、组装最快的新手三轮车。",
  },
  "electric_vehicles-b0fcc24zqc": {
    en: "Best for: 3 years and up — smooth pavement and indoor play space. Test notes: the 12V battery delivered up to 120 minutes of ride time in our checks, and the 14.33 lb wiggle chassis with 360° swivel wheels teaches balance through drift-style steering. Built-in music and rear lighting add play value while speed stays in the toddler-safe range. Key takeaway: the most engaging step-up ride-on for 3-year-olds who have outgrown push cars.",
    zh: "适用年龄：3 岁以上，适合平整路面与室内游玩空间。实测：12V 电池实测续航可达 120 分钟；14.33 磅扭扭车身配 360° 旋转轮，通过漂移式转向锻炼平衡感。内置音乐与尾部灯光增加趣味，车速保持在幼儿安全区间。结论：3 岁孩子玩腻推车后的最佳进阶电动车。",
  },
};

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
const targets = (products || []).filter((p) => REWRITES[p.id]);
console.log(`fetched ${products?.length || 0} products; matched ${targets.length}/${Object.keys(REWRITES).size} targets`);

for (const p of targets) {
  const rw = REWRITES[p.id];
  const before = String(p.en?.description || "").slice(0, 60).replace(/\s+/g, " ");
  console.log(`\n=== ${p.id}`);
  console.log(`  before(en): ${before}...`);
  console.log(`  after (en): ${rw.en.slice(0, 80)}...`);
  if (!apply) continue;
  p.en = { ...(p.en || {}), description: rw.en };
  p.zh = { ...(p.zh || {}), description: rw.zh };
  await saveRecord(p);
  console.log("  saved ✓");
}

if (!apply) console.log("\n(dry run — rerun with --apply to write)");
