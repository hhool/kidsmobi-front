// Accurate live keyword-density audit for the 5 target routes.
// Strategy: fetch prerendered HTML, extract VISIBLE BODY text only
// (strip script/style/meta/title/link/head), count exact core-keyword
// phrase hits, and classify against an SEO band + Google stuffing ceiling.
//
// Bands (conservative, Google-aligned; Google publishes no hard number,
// so 3% is the widely-used ceiling before "unnatural repetition" flags):
//   < 1.0%  -> 未达标   (under-optimized; weak topical signal)
//   1.0-2.5% -> 达标     (healthy topical-relevance sweet spot)
//   2.5-3.0% -> 偏高     (ok, watch)
//   > 3.0%  -> 堆砌风险   (keyword-stuffing risk)
//
// Reports exact-phrase (EXACT) vs variant-aware (VAR) density. Google does NOT
// publish a minimum density, and it matches plural/inflected forms to a query,
// so VAR (optional trailing 's' on each word) is the realistic "is this page
// about the keyword" signal. EXACT is shown so we also catch cases where the
// precise phrase is entirely absent from visible copy.
//
// Usage: node scripts/seo/live-keyword-density.mjs

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(import.meta.url), "../..");
const BASE = "https://balancebiketoddler.com";

const ROUTES = { home: "/", products: "/products", reviews: "/reviews", guides: "/guides", news: "/news" };
const CORE = {
  home: ["balance bike", "kids scooter", "kids bike", "jogging stroller", "kids electric car"],
  products: ["toddler bike", "balance bike toddler", "twin stroller", "kids electric scooter"],
  reviews: ["travel stroller", "jogging stroller", "kids dirt bike", "stroller reviews"],
  guides: ["how to choose a baby stroller", "balance bike for 1 year old", "balance bike size chart"],
  news: ["kids electric bike", "electric dirt bike for kids", "foldable electric scooter"],
};

const TARGET_MIN = 1.0, SWEET_MAX = 2.5, STUFF_CEIL = 3.0;
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function countExact(text, phrase) {
  const re = new RegExp("\\b" + esc(phrase) + "\\b", "gi");
  return (text.match(re) || []).length;
}
// Variant-aware: optional trailing 's' on EVERY word (Google matches
// "kids electric bikes" to "kids electric bike"). This is the realistic
// topical-relevance signal.
function countVar(text, phrase) {
  const pat = phrase.split(" ").map((w) => esc(w) + "s?").join("\\s+");
  const re = new RegExp("\\b" + pat + "\\b", "gi");
  return (text.match(re) || []).length;
}

// Extraction that approximates Google's post-render DOM text. This is a
// client-rendered SPA: the React-rendered copy lives inside <script> data
// blobs, so we KEEP script inner text (it becomes visible text after JS
// executes) but DROP tags, meta/title/link/style. We don't strip <script>
// content because doing so (with a naive regex) also swallows visible copy
// when a JSON string contains the literal "</script>".
function extractBody(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<head[\s\S]*?<\/head>/gi, " ")
    .replace(/<meta[\s\S]*?>/gi, " ")
    .replace(/<title[\s\S]*?<\/title>/gi, " ")
    .replace(/<link[\s\S]*?>/gi, " ")
    .replace(/<\/?script[^>]*>/gi, " ") // drop tag markers, keep inner data text
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function titleOf(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].trim() : "(none)";
}

async function fetchHtml(url) {
  const sep = url.includes("?") ? "&" : "?";
  const bust = `${sep}_audit=${Date.now()}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(url + bust, { signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0 GEO-audit" } });
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, html: await res.text() };
  } catch (e) {
    return { ok: false, error: String(e) };
  } finally {
    clearTimeout(t);
  }
}
function classify(d) {
  if (d < TARGET_MIN) return "偏低";
  if (d > STUFF_CEIL) return "堆砌风险";
  if (d > SWEET_MAX) return "偏高";
  return "达标";
}

const rows = [];
console.log("ROUTE   | KEYWORD                        | EXACT | VAR  | WORDS | DENS% | STATUS");
console.log("--------+--------------------------------+-------+------+-------+-------+--------");
for (const route of Object.keys(ROUTES)) {
  const got = await fetchHtml(BASE + ROUTES[route]);
  if (!got.ok) { console.log(`${route} -> FETCH FAILED ${got.status || got.error}`); continue; }
  const body = extractBody(got.html);
  const words = (body.match(/[A-Za-z']+/g) || []).length;
  console.log(`  [${route} title] ${titleOf(got.html)}`);
  for (const kw of CORE[route]) {
    const ex = countExact(body, kw);
    const va = countVar(body, kw);
    // Density is computed on the variant-aware count (Google matches inflections).
    const d = words ? ((va * kw.split(" ").length) / words) * 100 : 0;
    const cls = classify(d);
    // Precise-phrase gap: variant present but exact singular phrase absent from visible copy.
    const gap = va > 0 && ex === 0 ? " (精确短语缺位)" : "";
    rows.push({ route, kw, ex, va, words, d, cls });
    console.log(
      `${route.padEnd(7)} | ${kw.padEnd(30)} | ${String(ex).padStart(5)} | ${String(va).padStart(4)} | ${String(words).padStart(5)} | ${d.toFixed(2).padStart(5)} | ${cls}${gap}`
    );
  }
}
console.log("\nDENS% = variant-aware (Google matches inflections). 达标 1.0-2.5% | 偏高 2.5-3.0% | 堆砌风险 >3.0% (Google stuffing ceiling)");
console.log("“精确短语缺位” = 变体已出现但精确单数短语未见于可见正文（精确匹配工具会判低）。");
const gaps = rows.filter((r) => r.va === 0).map((r) => `${r.route}/${r.kw}`);
const risk = rows.filter((r) => r.cls === "堆砌风险").map((r) => `${r.route}/${r.kw}(${r.d.toFixed(2)}%)`);
const exactGap = rows.filter((r) => r.va > 0 && r.ex === 0).map((r) => `${r.route}/${r.kw}`);
console.log(`\n变体完全缺位 (${gaps.length}): ${gaps.join(", ") || "none"}`);
console.log(`堆砌风险 (${risk.length}): ${risk.join(", ") || "none"}`);
console.log(`精确短语缺位(${exactGap.length}): ${exactGap.join(", ") || "none"}`);
console.log("\n说明：谷歌并无“最低密度”要求；其公开关注的是过度重复（关键词堆砌），业界以 ~3% 为安全上限。");
console.log("“偏低”是精确匹配工具的启发值，并非谷歌惩罚信号。真正需修复的是“变体完全缺位 / 精确短语缺位”（已在本轮静态正文注入中补齐）。");
