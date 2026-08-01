#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_INPUT = path.resolve("../env/cms-export-1785532022314.json");
const DEFAULT_JSON_OUTPUT = path.resolve("tmp/title_phrase_lexicon.json");
const DEFAULT_REPORT_OUTPUT = path.resolve("tmp/title_phrase_lexicon.report.json");
const DEFAULT_TS_OUTPUT = path.resolve("src/lib/titlePhraseLexicon.ts");
const DEFAULT_GLOSSARY = path.resolve("scripts/config/product_zh_glossary.v1.json");

const STOP_WORDS = new Set([
  "a", "an", "and", "the", "for", "with", "to", "of", "in", "on", "by", "from",
  "old", "new", "plus", "set", "pack", "multiple", "color", "colors", "edition", "gift",
]);

const PHRASE_ZH_MAP = {
  "kids bike": "儿童自行车",
  "kids bikes": "儿童自行车",
  "bicycle": "自行车",
  "bmx": "BMX",
  "bmx style": "BMX 风格",
  "bmx style bicycle": "BMX 风格自行车",
  "training wheels": "辅助轮",
  "coaster brake": "倒踩刹车",
  "balance bike": "平衡车",
  "toddler balance bike": "幼儿平衡车",
  "high-carbon steel": "高碳钢",
  "high carbon steel": "高碳钢",
  "foldable": "可折叠",
  "adjustable": "可调节",
  "multiple colors": "多色可选",
  "boys girls": "男孩女孩",
  "toddlers": "幼儿",
  "kids": "儿童",
  "baby stroller": "婴儿推车",
  "car seat": "安全座椅",
  "infant car seat": "婴儿安全座椅",
  "ride on": "骑乘",
  "ride on toy": "骑乘玩具",
  "push handle": "推把",
  "kick scooter": "滑板车",
  "jogging stroller": "慢跑推车",
  "double stroller": "双人推车",
  "travel stroller": "旅行推车",
  "portable": "便携",
  "lightweight": "轻量",
  "stroller": "推车",
  "travel": "旅行",
  "car": "车",
  "seat": "座椅",
  "infant": "婴儿",
  "compact": "紧凑",
  "balance": "平衡",
  "ride": "骑乘",
  "canopy": "顶篷",
  "fold": "折叠",
  "recline": "可躺",
  "remote control": "遥控",
  "umbrella stroller": "伞车",
  "travel system": "出行系统",
  "storage basket": "置物篮",
  "easy fold": "轻松折叠",
  "one hand fold": "单手折叠",
  "all terrain": "全地形",
  "rear facing": "后向安装",
  "convertible": "可转换",
  "indoor outdoor": "室内外",
};

const WORD_ZH_MAP = {
  kids: "儿童",
  kid: "儿童",
  toddler: "幼儿",
  toddlers: "幼儿",
  baby: "婴儿",
  boys: "男孩",
  girls: "女孩",
  bike: "自行车",
  bikes: "自行车",
  bicycle: "自行车",
  bmx: "BMX",
  style: "风格",
  training: "辅助",
  wheels: "轮",
  coaster: "倒踩",
  brake: "刹车",
  foldable: "可折叠",
  adjustable: "可调节",
  steel: "钢",
  carbon: "碳",
  high: "高",
  inch: "英寸",
  inches: "英寸",
  years: "岁",
  year: "岁",
  old: "",
  multiple: "多",
  colors: "色",
  color: "色",
  stroller: "推车",
  travel: "旅行",
  car: "车",
  seat: "座椅",
  fold: "折叠",
  infant: "婴儿",
  compact: "紧凑",
  balance: "平衡",
  ages: "年龄",
  age: "年龄",
  ride: "骑乘",
  toy: "玩具",
  toys: "玩具",
  canopy: "顶篷",
  recline: "可躺",
  storage: "储物",
  basket: "篮",
  convertible: "可转换",
  portable: "便携",
  lightweight: "轻量",
  electric: "电动",
  tricycle: "三轮车",
  scooter: "滑板车",
  wagon: "拖车",
  steering: "转向",
  brake: "刹车",
  steel: "钢",
  frame: "车架",
  adjustable: "可调节",
  handlebar: "车把",
  handle: "把手",
  push: "推行",
  system: "系统",
  outdoor: "户外",
  indoor: "室内",
  safety: "安全",
  control: "控制",
  remote: "遥控",
  black: "黑色",
  blue: "蓝色",
  pink: "粉色",
  red: "红色",
  green: "绿色",
  white: "白色",
  gray: "灰色",
  grey: "灰色",
  purple: "紫色",
};

function parseArgs(argv) {
  const args = {
    input: DEFAULT_INPUT,
    output: DEFAULT_JSON_OUTPUT,
    report: DEFAULT_REPORT_OUTPUT,
    tsOutput: DEFAULT_TS_OUTPUT,
    glossary: DEFAULT_GLOSSARY,
    minCount: 2,
    maxNgram: 4,
    top: 500,
  };

  for (const arg of argv) {
    if (arg.startsWith("--input=")) args.input = path.resolve(arg.slice(8));
    else if (arg.startsWith("--output=")) args.output = path.resolve(arg.slice(9));
    else if (arg.startsWith("--report=")) args.report = path.resolve(arg.slice(9));
    else if (arg.startsWith("--ts-output=")) args.tsOutput = path.resolve(arg.slice(12));
    else if (arg.startsWith("--glossary=")) args.glossary = path.resolve(arg.slice(11));
    else if (arg.startsWith("--min-count=")) args.minCount = Math.max(1, Number(arg.slice(12)) || 2);
    else if (arg.startsWith("--max-ngram=")) args.maxNgram = Math.max(1, Math.min(6, Number(arg.slice(12)) || 4));
    else if (arg.startsWith("--top=")) args.top = Math.max(50, Number(arg.slice(6)) || 500);
    else if (arg === "--help" || arg === "-h") args.help = true;
  }
  return args;
}

function printHelp() {
  console.log(`Usage: node scripts/build_title_phrase_lexicon.mjs [options]\n\nOptions:\n  --input=<path>       CMS export JSON (default: ${DEFAULT_INPUT})\n  --output=<path>      JSON lexicon output (default: ${DEFAULT_JSON_OUTPUT})\n  --report=<path>      Report output (default: ${DEFAULT_REPORT_OUTPUT})\n  --ts-output=<path>   TS lexicon output (default: ${DEFAULT_TS_OUTPUT})\n  --glossary=<path>    Glossary JSON with titlePhraseMap/titleWordMap (default: ${DEFAULT_GLOSSARY})\n  --min-count=<n>      Keep entries with frequency >= n (default: 2)\n  --max-ngram=<n>      N-gram max length (default: 4)\n  --top=<n>            Max entries in TS lexicon (default: 500)\n`);
}

async function readJsonIfExists(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function titleForProduct(product) {
  return normalizeText(product?.source?.rawTitle || product?.en?.name || product?.name || product?.zh?.name || "");
}

function tokenize(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .match(/[a-z0-9]+(?:-[a-z0-9]+)*/g) || [];
}

function addCandidate(map, phrase, productId, title) {
  const key = normalizeText(phrase).toLowerCase();
  if (!key) return;
  const entry = map.get(key) || { phrase: key, count: 0, productIds: new Set(), examples: [] };
  if (!entry.productIds.has(productId)) {
    entry.productIds.add(productId);
    entry.count += 1;
  }
  if (entry.examples.length < 3 && !entry.examples.includes(title)) {
    entry.examples.push(title);
  }
  map.set(key, entry);
}

function extractPatternPhrases(titleLower) {
  const phrases = [];

  const inchLadder = titleLower.match(/((?:\d{1,2}\s+){1,6}\d{1,2})\s*inch(?:es)?/i);
  if (inchLadder) {
    phrases.push(`${inchLadder[1].replace(/\s+/g, " ")} inch`);
  }

  const ageRange = titleLower.match(/(?:for\s+)?(\d+)\s*[-–]\s*(\d+)\s*years?\s*old/i);
  if (ageRange) {
    phrases.push(`${ageRange[1]}-${ageRange[2]} years old`);
  }

  const inOne = titleLower.match(/(\d+)\s*[- ]in[- ](\d+)/i);
  if (inOne) {
    phrases.push(`${inOne[1]}-in-${inOne[2]}`);
  }

  const protectedPatterns = [
    /training wheels?/i,
    /coaster brake/i,
    /bmx style bicycle/i,
    /bmx style/i,
    /high[- ]carbon steel/i,
    /balance bike/i,
    /kids bike/i,
    /multiple colors?/i,
    /jogging stroller/i,
    /double stroller/i,
    /travel stroller/i,
    /kick scooter/i,
    /ride[- ]on toy/i,
  ];

  for (const pattern of protectedPatterns) {
    const hit = titleLower.match(pattern);
    if (hit && hit[0]) {
      phrases.push(hit[0].replace(/\s+/g, " "));
    }
  }

  return [...new Set(phrases)];
}

function collectNgrams(tokens, maxNgram) {
  const phrases = [];
  for (let i = 0; i < tokens.length; i += 1) {
    for (let n = 1; n <= maxNgram && i + n <= tokens.length; n += 1) {
      const slice = tokens.slice(i, i + n);
      if (slice.every((t) => STOP_WORDS.has(t))) continue;
      const phrase = slice.join(" ");
      if (phrase.length < 3) continue;
      phrases.push(phrase);
    }
  }
  return phrases;
}

function translateByPattern(enPhrase) {
  const phrase = enPhrase.toLowerCase();

  const listInch = phrase.match(/^((?:\d{1,2}\s+){1,6}\d{1,2})\s*inch$/i);
  if (listInch) {
    return { zh: `${listInch[1].trim().replace(/\s+/g, "/")} 英寸`, source: "pattern", confidence: 0.94 };
  }

  const rangeYear = phrase.match(/^(\d+)\s*[-–]\s*(\d+)\s*years?\s*old$/i);
  if (rangeYear) {
    return { zh: `${rangeYear[1]}-${rangeYear[2]} 岁`, source: "pattern", confidence: 0.94 };
  }

  const inOne = phrase.match(/^(\d+)\s*[- ]in[- ](\d+)$/i);
  if (inOne) {
    return { zh: `${inOne[1]} 合 ${inOne[2]}`, source: "pattern", confidence: 0.9 };
  }

  const inch = phrase.match(/^(\d+(?:\.\d+)?)\s*inch(?:es)?$/i);
  if (inch) {
    return { zh: `${inch[1]} 英寸`, source: "pattern", confidence: 0.92 };
  }

  return null;
}

function translateByWords(enPhrase, wordMap) {
  const parts = enPhrase.split(/\s+/).filter(Boolean);
  if (!parts.length) return null;

  const translated = [];
  let mappedCount = 0;
  let unknownCount = 0;
  for (const part of parts) {
    if (STOP_WORDS.has(part)) continue;
    const zh = wordMap[part];
    const isNumber = /^\d+(?:\.\d+)?$/.test(part);
    if (zh) {
      translated.push(zh);
      mappedCount += 1;
      continue;
    }

    if (isNumber) {
      translated.push(part);
      mappedCount += 1;
      continue;
    }

    unknownCount += 1;
    translated.push(part);
  }

  const kept = translated.filter(Boolean);
  if (!kept.length) return null;

  const ratio = mappedCount / Math.max(1, mappedCount + unknownCount);
  if (ratio < 0.5) return null;

  const compact = kept.join("");
  if (!compact) return null;
  return { zh: compact, source: "word", confidence: Number((0.55 + ratio * 0.35).toFixed(2)) };
}

function mapEnglishToChinese(enPhrase, phraseMap, wordMap) {
  const canonical = enPhrase.toLowerCase();
  if (phraseMap[canonical]) {
    return { zh: phraseMap[canonical], source: "dictionary", confidence: 1 };
  }

  const patternHit = translateByPattern(canonical);
  if (patternHit) return patternHit;

  const wordHit = translateByWords(canonical, wordMap);
  if (wordHit) return wordHit;

  return { zh: "", source: "pending", confidence: 0 };
}

function toKey(phrase) {
  return phrase.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function toTs(entries) {
  const lines = [];
  lines.push("export type TitlePhraseLexiconEntry = {");
  lines.push("  key: string;");
  lines.push("  en: string;");
  lines.push("  zh: string;");
  lines.push("  count: number;");
  lines.push("  source: \"dictionary\" | \"pattern\" | \"word\" | \"pending\";");
  lines.push("  confidence: number;");
  lines.push("};");
  lines.push("");
  lines.push(`export const TITLE_PHRASE_LEXICON_VERSION = \"${new Date().toISOString()}\";`);
  lines.push("");
  lines.push("export const TITLE_PHRASE_LEXICON: TitlePhraseLexiconEntry[] = [");
  for (const entry of entries) {
    const en = JSON.stringify(entry.en);
    const zh = JSON.stringify(entry.zh);
    lines.push(
      `  { key: ${JSON.stringify(entry.key)}, en: ${en}, zh: ${zh}, count: ${entry.count}, source: ${JSON.stringify(entry.source)}, confidence: ${entry.confidence} },`
    );
  }
  lines.push("];\n");
  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const [raw, glossary] = await Promise.all([
    fs.readFile(args.input, "utf8"),
    readJsonIfExists(args.glossary),
  ]);
  const payload = JSON.parse(raw);
  const phraseMap = {
    ...PHRASE_ZH_MAP,
    ...(glossary?.titlePhraseMap && typeof glossary.titlePhraseMap === "object" ? glossary.titlePhraseMap : {}),
  };
  const wordMap = {
    ...WORD_ZH_MAP,
    ...(glossary?.titleWordMap && typeof glossary.titleWordMap === "object" ? glossary.titleWordMap : {}),
  };
  const products = payload?.data?.collections?.products;
  if (!Array.isArray(products)) {
    throw new Error("Invalid export: missing data.collections.products");
  }

  const candidateMap = new Map();
  const perProduct = [];

  for (const product of products) {
    const title = titleForProduct(product);
    if (!title) continue;
    const titleLower = title.toLowerCase();
    const tokens = tokenize(title);
    const patternPhrases = extractPatternPhrases(titleLower);
    const ngramPhrases = collectNgrams(tokens, args.maxNgram);
    const allPhrases = [...new Set([...patternPhrases, ...ngramPhrases])];

    for (const phrase of allPhrases) {
      addCandidate(candidateMap, phrase, String(product.id || ""), title);
    }

    perProduct.push({
      id: String(product.id || ""),
      categoryId: String(product.categoryId || product.category || ""),
      title,
      tokens,
      phrases: allPhrases.slice(0, 80),
    });
  }

  const lexiconEntries = [...candidateMap.values()]
    .filter((entry) => entry.count >= args.minCount)
    .map((entry) => {
      const mapped = mapEnglishToChinese(entry.phrase, phraseMap, wordMap);
      return {
        key: toKey(entry.phrase),
        en: entry.phrase,
        zh: mapped.zh,
        source: mapped.source,
        confidence: Number(mapped.confidence.toFixed(2)),
        count: entry.count,
        productCount: entry.productIds.size,
        examples: entry.examples,
      };
    })
    .sort((a, b) => b.count - a.count || b.en.length - a.en.length || a.en.localeCompare(b.en));

  const tsEntries = lexiconEntries.slice(0, args.top).map(({ key, en, zh, count, source, confidence }) => ({
    key,
    en,
    zh,
    count,
    source,
    confidence,
  }));

  const mappedCount = lexiconEntries.filter((entry) => entry.zh).length;
  const pendingCount = lexiconEntries.length - mappedCount;

  const jsonOutput = {
    schemaVersion: "title-phrase-lexicon/v1",
    generatedAt: new Date().toISOString(),
    input: args.input,
    glossary: args.glossary,
    productCount: products.length,
    candidateCount: candidateMap.size,
    outputCount: lexiconEntries.length,
    mappedCount,
    pendingCount,
    entries: lexiconEntries,
    perProduct,
  };

  const report = {
    generatedAt: new Date().toISOString(),
    input: args.input,
    productCount: products.length,
    ngramMax: args.maxNgram,
    minCount: args.minCount,
    lexiconEntries: lexiconEntries.length,
    mappedCount,
    pendingCount,
    mappingCoverage: lexiconEntries.length ? Number(((mappedCount * 100) / lexiconEntries.length).toFixed(1)) : 0,
    top20: lexiconEntries.slice(0, 20).map((item) => ({
      en: item.en,
      zh: item.zh,
      source: item.source,
      count: item.count,
    })),
  };

  const tsContent = toTs(tsEntries);

  await Promise.all([
    fs.mkdir(path.dirname(args.output), { recursive: true }),
    fs.mkdir(path.dirname(args.report), { recursive: true }),
    fs.mkdir(path.dirname(args.tsOutput), { recursive: true }),
  ]);

  await Promise.all([
    fs.writeFile(args.output, `${JSON.stringify(jsonOutput, null, 2)}\n`, "utf8"),
    fs.writeFile(args.report, `${JSON.stringify(report, null, 2)}\n`, "utf8"),
    fs.writeFile(args.tsOutput, tsContent, "utf8"),
  ]);

  console.log(`[title-lexicon] products=${products.length} candidates=${candidateMap.size} entries=${lexiconEntries.length}`);
  console.log(`[title-lexicon] mapped=${mappedCount} pending=${pendingCount}`);
  console.log(`[title-lexicon] json=${args.output}`);
  console.log(`[title-lexicon] report=${args.report}`);
  console.log(`[title-lexicon] ts=${args.tsOutput}`);
}

main().catch((error) => {
  console.error(`[title-lexicon] ${error.message}`);
  process.exitCode = 1;
});
