// Keyword-density baseline/after analyzer for the 5 target routes.
// Extracts the EN copy strings from pageCopy.ts (home/products/reviews/news)
// and from GuidesSection.tsx (guides), then counts core-keyword phrase hits.
//
// Usage: node scripts/seo/keyword-density.mjs [--after]

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const pageCopyPath = resolve(ROOT, "src/config/pageCopy.ts");
const guidesPath = resolve(ROOT, "src/components/GuidesSection.tsx");

const CORE = {
  home: ["balance bike", "kids scooter", "kids bike", "jogging stroller", "kids electric car"],
  products: ["toddler bike", "balance bike toddler", "twin stroller", "kids electric scooter"],
  reviews: ["travel stroller", "jogging stroller", "kids dirt bike", "stroller reviews"],
  guides: ["how to choose a baby stroller", "balance bike for 1 year old", "balance bike size chart"],
  news: ["kids electric bike", "electric dirt bike for kids", "foldable electric scooter"],
};

// Pull the `en: { ... }` block out of pageCopy.ts (top-level en object).
function extractEnBlock(src) {
  const start = src.indexOf("en: {");
  if (start < 0) return "";
  // find the matching closing brace by depth scan from start+5
  let depth = 0;
  let i = src.indexOf("{", start);
  for (; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") {
      depth--;
      if (depth === 0) break;
    }
  }
  return src.slice(start, i + 1);
}

// Split an en block into per-route text by the 2-space route keys.
function splitRoutes(enBlock) {
  const routes = {};
  const re = /\n\s{2,}(home|products|reviews|news|about):\s*\{/g;
  let m;
  const marks = [];
  while ((m = re.exec(enBlock))) marks.push([m[1], m.index]);
  for (let k = 0; k < marks.length; k++) {
    const [name, idx] = marks[k];
    const end = k + 1 < marks.length ? marks[k + 1][1] : enBlock.length;
    const body = enBlock.slice(idx, end);
    const strings = (body.match(/"((?:[^"\\]|\\.)*)"/g) || []).map((s) => s.slice(1, -1).replace(/\\"/g, '"'));
    routes[name] = strings;
  }
  return routes;
}

function countPhrase(text, phrase) {
  const re = new RegExp("\\b" + phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "gi");
  const matches = text.match(re);
  return matches ? matches.length : 0;
}

const pageCopySrc = readFileSync(pageCopyPath, "utf8");
const enBlock = extractEnBlock(pageCopySrc);
const routes = splitRoutes(enBlock);

// Guides content comes from GuidesSection.tsx (not pageCopy).
const guidesSrc = readFileSync(guidesPath, "utf8");
const guidesStrings = (guidesSrc.match(/"((?:[^"\\]|\\.)*)"/g) || [])
  .map((s) => s.slice(1, -1).replace(/\\"/g, '"'))
  .filter((s) => /[A-Za-z]{4}/.test(s)); // keep English-ish strings

const sources = {
  home: routes.home || [],
  products: routes.products || [],
  reviews: routes.reviews || [],
  news: routes.news || [],
  guides: guidesStrings,
};

console.log("route            | keyword                      | hits | words  | density%");
console.log("-----------------+------------------------------+------+--------+---------");
for (const route of Object.keys(CORE)) {
  const text = sources[route].join(" ");
  const words = (text.match(/[A-Za-z']+/g) || []).length;
  for (const kw of CORE[route]) {
    const hits = countPhrase(text, kw);
    const density = words ? ((hits * kw.split(" ").length) / words) * 100 : 0;
    console.log(
      `${route.padEnd(16)} | ${kw.padEnd(28)} | ${String(hits).padStart(4)} | ${String(words).padStart(6)} | ${density.toFixed(2)}`
    );
  }
  console.log("-----------------+------------------------------+------+--------+---------");
}
