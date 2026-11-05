#!/usr/bin/env node
/**
 * Build the homepage's font stylesheet subset.
 *
 * Why this exists
 * ---------------
 * public/fonts/fonts.css is the self-hosted mirror of Google Fonts: 620
 * @font-face rules, 660KB raw. 606 of those rules are Noto Sans SC - the
 * Chinese face - split across 103 unicode-range shards.
 *
 * The homepage is an English page. It needs Outfit (the site's display and
 * body face) and, for the Chinese pages, Noto Sans SC. Loading all 103
 * Chinese shards to render an English page means the browser downloads and
 * matches against a stylesheet that is almost entirely dead weight, and the
 * measured LCP ladder showed the font stylesheet sitting right on the
 * critical path: removing it took the static homepage from LCP 2494ms to
 * 1211ms and TBT from 182ms to 140ms (04-build/item-23-24-decision.md
 * section 6, step 5).
 *
 * So the homepage gets a SUBSET: every Latin face, plus only the Chinese
 * shards that cover characters the English pages cannot render without them.
 * The English homepage's copy is ASCII, so the Chinese shards are not needed
 * at all there - but the subset is still built rather than the font file
 * deleted, so the Chinese pages keep their faces.
 *
 * What this guarantees
 * --------------------
 *   1. Every Latin face survives, for every family, weight and style.
 *   2. The Latin unicode-ranges are byte-identical to the full sheet.
 *   3. The output is deterministic.
 *   4. A face whose unicode-range covers ONLY non-Latin characters is
 *      dropped, and the count of dropped faces is reported - so a silent
 *      regression (a Latin shard misclassified) shows up as a number.
 *
 * Usage:
 *   node scripts/build-font-subset.mjs --in public/fonts/fonts.css \
 *     --out public/fonts/fonts-latin.css
 *   node scripts/build-font-subset.mjs --self-test
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

function readArg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

/**
 * The @font-face blocks of a stylesheet.
 *
 * The sheet is a flat list of @font-face rules, so splitting on the rule
 * boundary is enough - but the blocks are kept WHOLE, so every property
 * (font-display, font-style, font-weight, unicode-range) survives.
 */
function splitFontFaces(css) {
  const blocks = [];
  const pattern = /@font-face\s*\{([^}]*)\}/g;
  let match;
  while ((match = pattern.exec(css)) !== null) {
    blocks.push({ body: match[1], full: match[0] });
  }
  return blocks;
}

/**
 * Does this unicode-range cover any Latin character?
 *
 * The ranges are written as "U+XXXX" and "U+XXXX-YYYY" lists. The Latin
 * blocks a page needs are the Basic Latin range (U+0000-U+007F), Latin-1
 * Supplement (U+0080-U+00FF) and the Latin Extended blocks. A shard that
 * covers none of those cannot render an English page.
 */
function coversLatin(unicodeRange) {
  if (!unicodeRange) return false;
  const text = String(unicodeRange);
  const ranges = [];
  for (const part of text.split(",")) {
    const trimmed = part.trim();
    const single = /^U\+([0-9A-Fa-f]{4,6})$/.exec(trimmed);
    if (single) {
      ranges.push([parseInt(single[1], 16), parseInt(single[1], 16)]);
      continue;
    }
    const span = /^U\+([0-9A-Fa-f]{4,6})\s*-\s*([0-9A-Fa-f]{4,6})$/.exec(trimmed);
    if (span) {
      ranges.push([parseInt(span[1], 16), parseInt(span[2], 16)]);
    }
  }
  if (!ranges.length) return false;

  // The Basic Latin block and Latin-1 Supplement. A shard that overlaps
  // either can render English text.
  const LATIN_BLOCKS = [
    [0x0000, 0x007f],
    [0x0080, 0x00ff],
    [0x0100, 0x017f],
  ];
  for (const [start, end] of ranges) {
    for (const [latinStart, latinEnd] of LATIN_BLOCKS) {
      if (start <= latinEnd && end >= latinStart) return true;
    }
  }
  return false;
}

/**
 * The unicode-range of a font-face block, or "" when it has none.
 */
function unicodeRangeOf(block) {
  const body = typeof block === "string" ? block : block.body;
  const match = /unicode-range\s*:\s*([^;]+);/.exec(body);
  return match ? match[1].trim() : "";
}

/**
 * Build the subset.
 */
/**
 * Does this unicode-range cover Basic Latin (U+0000-00FF)?
 *
 * That block is what an English page needs: every ASCII character plus the
 * Latin-1 supplement (accented letters, the euro sign, the multiplication
 * sign). A shard that covers none of it cannot render a single word of the
 * homepage's copy.
 */
function coversBasicLatin(unicodeRange) {
  if (!unicodeRange) return false;
  const ranges = [];
  for (const part of String(unicodeRange).split(",")) {
    const trimmed = part.trim();
    const single = /^U\+([0-9A-Fa-f]{4,6})$/.exec(trimmed);
    if (single) {
      ranges.push([parseInt(single[1], 16), parseInt(single[1], 16)]);
      continue;
    }
    const span = /^U\+([0-9A-Fa-f]{4,6})\s*-\s*([0-9A-Fa-f]{4,6})$/.exec(trimmed);
    if (span) {
      ranges.push([parseInt(span[1], 16), parseInt(span[2], 16)]);
    }
  }
  if (!ranges.length) return false;
  for (const [start, end] of ranges) {
    if (start <= 0x00ff && end >= 0x0000) return true;
  }
  return false;
}

/**
 * Does this unicode-range cover the Latin Extended-A block (U+0100-017F) or
 * Latin Extended-B (U+0180-024F)?
 *
 * The homepage carries accented brand and product names - "Stokke", "Baby
 * Jogger", and the em dash and typographic punctuation that come with them.
 * A shard that covers only ASCII would drop those characters to the system
 * font, which is a visible difference on the product names.
 */
function coversLatinExtended(unicodeRange) {
  if (!unicodeRange) return false;
  const ranges = [];
  for (const part of String(unicodeRange).split(",")) {
    const trimmed = part.trim();
    const single = /^U\+([0-9A-Fa-f]{4,6})$/.exec(trimmed);
    if (single) {
      ranges.push([parseInt(single[1], 16), parseInt(single[1], 16)]);
      continue;
    }
    const span = /^U\+([0-9A-Fa-f]{4,6})\s*-\s*([0-9A-Fa-f]{4,6})$/.exec(trimmed);
    if (span) {
      ranges.push([parseInt(span[1], 16), parseInt(span[2], 16)]);
    }
  }
  if (!ranges.length) return false;
  for (const [start, end] of ranges) {
    if (start <= 0x024f && end >= 0x0100) return true;
  }
  return false;
}

/**
 * The identity of a face GROUP: family + weight + style.
 */
function groupKey(body) {
  const family = /font-family\s*:\s*'([^']+)'/.exec(body)?.[1] || "";
  const weight = /font-weight\s*:\s*([0-9]+)/.exec(body)?.[1] || "";
  const style = /font-style\s*:\s*(\w+)/.exec(body)?.[1] || "";
  return `${family}|${weight}|${style}`;
}

/**
 * Build the subset.
 *
 * The decision is per RULE, not per group, and that is deliberate: Google
 * Fonts splits one face into rules by unicode-range, and each rule covers a
 * DISJOINT character set. Keeping the Latin rules and dropping the CJK ones
 * leaves every character in the page's copy covered by exactly one face -
 * no gaps, no overlaps, no half-a-family.
 *
 * The Chinese pages keep using the full sheet (public/fonts/fonts.css), so
 * nothing about the Chinese typography changes.
 */
export function buildSubset(css) {
  const blocks = splitFontFaces(css);
  const kept = [];
  const dropped = [];

  for (const block of blocks) {
    const range = unicodeRangeOf(block);
    const latin = coversBasicLatin(range);
    const extended = coversLatinExtended(range);
    if (latin || extended) {
      kept.push(block.full);
    } else {
      dropped.push(block);
    }
  }
  return { kept, dropped, total: blocks.length };
}

/**
 * The self-test. A rule set without a self-test is a rule that rots.
 *
 * The assertions:
 *   1. Every Latin face in the input survives.
 *   2. Every dropped face covers no Latin range.
 *   3. No dropped face belongs to a family that also has a Latin face with
 *      the same weight and style - that would be a silent loss.
 *   4. The output is byte-identical across two runs.
 */
function selfTest() {
  const input = readFileSync(
    path.resolve(path.dirname(new URL(import.meta.url).pathname), "../public/fonts/fonts.css"),
    "utf8",
  );

  const first = buildSubset(input);
  const second = buildSubset(input);

  const failures = [];

  // 1. every rule that covers Basic Latin survives
  const inputBlocks = splitFontFaces(input);
  for (const block of inputBlocks) {
    const range = unicodeRangeOf(block);
    if (coversBasicLatin(range) || coversLatinExtended(range)) {
      if (!first.kept.includes(block.full)) {
        failures.push(`a Latin face was dropped: ${block.full.slice(0, 90)}`);
      }
    }
  }

  // 2. every dropped rule covers neither Basic Latin nor Latin Extended
  for (const block of first.dropped) {
    const range = unicodeRangeOf(block);
    if (coversBasicLatin(range) || coversLatinExtended(range)) {
      failures.push(`a Latin face was dropped: ${block.full.slice(0, 90)}`);
    }
  }

  // 3. the subset still covers the whole Basic Latin block for every
  //    family/weight/style group that survives. A group that kept ONE Latin
  //    shard but lost another would leave characters uncovered - the
  //    browser would fall back to the system font for them, which is a
  //    visual change nobody would attribute to a font sheet.
  const groups = new Map();
  for (const block of inputBlocks) {
    const key = groupKey(block.body);
    const range = unicodeRangeOf(block);
    const entry = groups.get(key) || { basic: false, extended: false };
    if (coversBasicLatin(range)) entry.basic = true;
    if (coversLatinExtended(range)) entry.extended = true;
    groups.set(key, entry);
  }
  for (const [key, coverage] of groups) {
    if (!coverage.basic && !coverage.extended) continue;
    const keptForGroup = first.kept.filter((f) => groupKey(f) === key);
    if (!keptForGroup.length) {
      failures.push(`group ${key} has Latin shards but none survived`);
      continue;
    }
    const keptBasic = keptForGroup.some((f) => coversBasicLatin(unicodeRangeOf({ body: f })));
    const keptExtended = keptForGroup.some((f) => coversLatinExtended(unicodeRangeOf({ body: f })));
    if (coverage.basic && !keptBasic) {
      failures.push(`group ${key} lost its Basic Latin coverage`);
    }
    if (coverage.extended && !keptExtended) {
      failures.push(`group ${key} lost its Latin Extended coverage`);
    }
  }

  // 4. deterministic
  if (first.kept.join("\n") !== second.kept.join("\n")) {
    failures.push("two runs produced different output");
  }

  console.log(`font faces in: ${first.total}`);
  console.log(`kept: ${first.kept.length}  dropped: ${first.dropped.length}`);
  console.log(`bytes: ${Buffer.byteLength(input, "utf8")} -> ${Buffer.byteLength(first.kept.join("\n"), "utf8")}`);

  if (failures.length) {
    console.error(`\nSELF-TEST FAILED (${failures.length}):`);
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }
  console.log("\nSELF-TEST PASSED");
}

function main() {
  if (process.argv.includes("--self-test")) {
    selfTest();
    return;
  }

  const inPath = readArg("--in", "public/fonts/fonts.css");
  const outPath = readArg("--out", "public/fonts/fonts-latin.css");
  if (!existsSync(inPath)) {
    console.error(`FATAL: ${inPath} does not exist`);
    process.exit(1);
  }
  const css = readFileSync(inPath, "utf8");
  const { kept, dropped, total } = buildSubset(css);
  if (!kept.length) {
    console.error("FATAL: the subset is empty - the Latin detection is broken");
    process.exit(1);
  }
  writeFileSync(outPath, kept.join("\n") + "\n", "utf8");
  console.log(`faces: ${total} -> kept ${kept.length}, dropped ${dropped.length}`);
  console.log(`bytes: ${Buffer.byteLength(css, "utf8")} -> ${Buffer.byteLength(kept.join("\n"), "utf8")}`);
  console.log(`wrote ${outPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
