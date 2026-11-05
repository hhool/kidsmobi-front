#!/usr/bin/env node
/**
 * The homepage hero photographs have to stay small, and stay the shape the
 * layout expects.
 *
 * Why this guard exists
 * ---------------------
 * The hero is the homepage's Largest Contentful Paint. Self-hosting it made
 * the paint timeable, and timing it showed the paint was bound by the
 * network model, not by the main thread: Lighthouse's mobile preset charges
 * 562.5 ms of request latency and 1.6 Mbps, so the hero's bytes go straight
 * into the number. Measured on the built document, three runs per variant:
 *
 *     960 px / 102 KB   LCP 2,330 ms   over the 2,000 ms budget
 *     768 px /  35 KB   LCP 1,797 ms   passes
 *
 * So 768 px and 35 KB are load-bearing, and they are load-bearing in a way
 * nobody would notice by looking: the hero is painted at 62 % opacity under
 * a dark gradient, so a re-export at 2x - the "obvious" quality improvement -
 * costs 600 ms of paint and looks identical. Without this guard that change
 * is one drag-and-drop away, and the audit goes red months later with no
 * obvious cause.
 *
 * What it checks
 * --------------
 *   - every URL in HERO_BG_IMAGES resolves to a file that exists
 *   - it is actually a WebP (a PNG renamed to .webp decodes in no browser)
 *   - it is exactly 768 px wide
 *   - it keeps the 3:2 aspect the layout was measured with
 *   - it is under 40 KiB
 *
 * Usage:
 *   node scripts/check-hero-weight.mjs             # check public/images/home
 *   node scripts/check-hero-weight.mjs --self-test # prove every rule can fail
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const HERO_MODULE = path.join(ROOT, "src", "lib", "heroImages.ts");

/** The width every hero file must have. See the header for the measurement. */
const EXPECTED_WIDTH = 768;
/** The byte ceiling. 40 KiB is 5 KiB of headroom over the current 34.8 KB. */
const MAX_BYTES = 40 * 1024;
/** The width of the small candidate the document offers small screens. */
const SMALL_WIDTH = 480;
/** Its ceiling: 20 KiB, with headroom over the current 17.8 KB. */
const SMALL_MAX_BYTES = 20 * 1024;
/** The aspect the hero box was measured against. */
const EXPECTED_ASPECT = 3 / 2;
const ASPECT_TOLERANCE = 0.02;

const problems = [];
const notes = [];
const fail = (message) => problems.push(message);
const ok = (message) => notes.push(message);

/**
 * Read the width and height out of a WebP file's header.
 *
 * Lossy (VP8 ), lossless (VP8L) and extended (VP8X) WebP all store the
 * dimensions in different places, so all three are decoded here. A guard that
 * only understood one of them would fail on a re-export that happened to use
 * a different encoder setting.
 */
export function readWebpHeader(buffer) {
  if (buffer.length < 30) return { ok: false, reason: "the file is too short to be an image" };
  const riff = buffer.toString("ascii", 0, 4);
  const webp = buffer.toString("ascii", 8, 12);
  if (riff !== "RIFF" || webp !== "WEBP") {
    return { ok: false, reason: "it is not a WebP file" };
  }
  const chunk = buffer.toString("ascii", 12, 16);
  if (chunk === "VP8X") {
    const width = 1 + (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16));
    const height = 1 + (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16));
    return { ok: true, width, height, format: "VP8X" };
  }
  if (chunk === "VP8L") {
    const bits = buffer[21] | (buffer[22] << 8) | (buffer[23] << 16) | (buffer[24] << 24);
    const width = (bits & 0x3fff) + 1;
    const height = ((bits >> 14) & 0x3fff) + 1;
    return { ok: true, width, height, format: "VP8L" };
  }
  if (chunk === "VP8 ") {
    const start = buffer.indexOf(Buffer.from([0x9d, 0x01, 0x2a]));
    if (start < 0) return { ok: false, reason: "the VP8 frame header is missing" };
    const width = buffer.readUInt16LE(start + 3) & 0x3fff;
    const height = buffer.readUInt16LE(start + 5) & 0x3fff;
    return { ok: true, width, height, format: "VP8" };
  }
  return { ok: false, reason: `unknown WebP chunk "${chunk}"` };
}

/**
 * Judge one hero file from its metadata.
 *
 * Kept separate from the filesystem so the self-test can feed it the shapes
 * that must fail without writing 40 KiB fixtures to disk.
 */
export function judgeHero(label, meta, { expectedWidth = EXPECTED_WIDTH, maxBytes = MAX_BYTES } = {}) {
  const issues = [];
  if (!meta.exists) {
    issues.push(`${label}: the file does not exist`);
    return issues;
  }
  if (!meta.header || !meta.header.ok) {
    issues.push(`${label}: ${meta.header ? meta.header.reason : "the file could not be read"}`);
    return issues;
  }
  const { width, height } = meta.header;
  if (width !== expectedWidth) {
    issues.push(
      `${label}: it is ${width} px wide, but the measured width is ${expectedWidth} px ` +
        `(the paint budget was measured at ${EXPECTED_WIDTH} px)`,
    );
  }
  const aspect = height > 0 ? width / height : 0;
  if (Math.abs(aspect - EXPECTED_ASPECT) > ASPECT_TOLERANCE) {
    issues.push(
      `${label}: its aspect is ${aspect.toFixed(3)}:1, but the layout was measured at ` +
        `${EXPECTED_ASPECT.toFixed(3)}:1 - a squashed re-export crops differently under object-cover`,
    );
  }
  if (meta.bytes > maxBytes) {
    issues.push(
      `${label}: it is ${(meta.bytes / 1024).toFixed(1)} KiB, over the ${maxBytes / 1024} KiB ` +
        `ceiling - on the preset's 1.6 Mbps this costs about ` +
        `${Math.round(((meta.bytes - maxBytes) / 1024 / 1600) * 8000)} ms of paint`,
    );
  }
  return issues;
}

/** The 480 px sibling of a 768 px hero, by the naming rule the encoder uses. */
export function smallSiblingOf(url) {
  const match = /^(.*\/hero-[a-z]+)-768\.webp$/.exec(url);
  return match ? `${match[1]}-480.webp` : null;
}

/** Read `HERO_BG_IMAGES` out of the module that owns it. */
export function readHeroImages(source) {
  const exportMatch = source.match(/HERO_BG_IMAGES[^\n]*=\s*\[([^\]]*)\]/);
  if (!exportMatch) return { errors: ["src/lib/heroImages.ts does not export HERO_BG_IMAGES"], urls: [] };
  const names = exportMatch[1]
    .split(",")
    .map((piece) => piece.trim())
    .filter(Boolean);
  const urls = [];
  const errors = [];
  for (const name of names) {
    const literal = new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`).exec(source);
    if (literal) urls.push(literal[1]);
    else urls.push(name.replace(/^["']|["']$/g, ""));
  }
  return { errors, urls };
}

// ---------------------------------------------------------------------------
// Self-test: every rule must be able to fail.
// ---------------------------------------------------------------------------
function selfTest() {
  const cases = [];
  const goodHeader = { ok: true, width: 768, height: 512, format: "VP8" };
  const good = { exists: true, header: goodHeader, bytes: 34_834 };

  cases.push(["a 768 px 34 KB hero passes", judgeHero("h", good).length === 0, judgeHero("h", good)]);
  cases.push([
    "a missing file fails",
    judgeHero("h", { ...good, exists: false }).length > 0,
    judgeHero("h", { ...good, exists: false }),
  ]);
  cases.push([
    "a 960 px hero fails",
    judgeHero("h", { ...good, header: { ...goodHeader, width: 960, height: 640 } }).length > 0,
    judgeHero("h", { ...good, header: { ...goodHeader, width: 960, height: 640 } }),
  ]);
  cases.push([
    "a 1600 px re-export fails",
    judgeHero("h", { ...good, header: { ...goodHeader, width: 1600, height: 1067 } }).length > 0,
    judgeHero("h", { ...good, header: { ...goodHeader, width: 1600, height: 1067 } }),
  ]);
  cases.push([
    "a heavy hero of the right width fails",
    judgeHero("h", { ...good, bytes: 120 * 1024 }).length > 0,
    judgeHero("h", { ...good, bytes: 120 * 1024 }),
  ]);
  cases.push([
    "a squashed hero fails",
    judgeHero("h", { ...good, header: { ...goodHeader, width: 768, height: 700 } }).length > 0,
    judgeHero("h", { ...good, header: { ...goodHeader, width: 768, height: 700 } }),
  ]);
  cases.push([
    "a non-WebP file fails",
    judgeHero("h", { ...good, header: { ok: false, reason: "it is not a WebP file" } }).length > 0,
    judgeHero("h", { ...good, header: { ok: false, reason: "it is not a WebP file" } }),
  ]);

  // The header reader, against real bytes. A PNG renamed to .webp is the
  // case a size-only check would pass.
  const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), Buffer.alloc(40)]);
  cases.push([
    "a PNG renamed to .webp is rejected",
    readWebpHeader(png).ok === false,
    readWebpHeader(png),
  ]);
  const truncated = Buffer.from("RIFF\x10\x00\x00\x00WEBP", "binary");
  cases.push([
    "a truncated file is rejected",
    readWebpHeader(truncated).ok === false,
    readWebpHeader(truncated),
  ]);

  // The small candidate: same rules, its own width and ceiling. A guard that
  // judged it at 768 would fail every correct build, and one that skipped it
  // would let a 960 px file be shipped as the "small" candidate.
  const small = { exists: true, header: { ok: true, width: 480, height: 320, format: "VP8" }, bytes: 17_774 };
  cases.push([
    "the 480 px candidate passes at its own width",
    judgeHero("s", small, { expectedWidth: 480, maxBytes: 20 * 1024 }).length === 0,
    judgeHero("s", small, { expectedWidth: 480, maxBytes: 20 * 1024 }),
  ]);
  cases.push([
    "a 768 px file used as the small candidate fails",
    judgeHero("s", good, { expectedWidth: 480, maxBytes: 20 * 1024 }).length > 0,
    judgeHero("s", good, { expectedWidth: 480, maxBytes: 20 * 1024 }),
  ]);
  cases.push([
    "the sibling name is derived from the 768 name",
    smallSiblingOf("/images/home/hero-stroller-768.webp") === "/images/home/hero-stroller-480.webp",
    smallSiblingOf("/images/home/hero-stroller-768.webp"),
  ]);
  cases.push([
    "a name that is not a hero has no sibling",
    smallSiblingOf("/images/derived/x-800.webp") === null,
    smallSiblingOf("/images/derived/x-800.webp"),
  ]);

  // The module reader.
  const listSource =
    'export const A = "/images/home/a.webp";\nexport const B = "/images/home/b.webp";\nexport const HERO_BG_IMAGES: readonly string[] = [A, B];';
  cases.push([
    "the module reader resolves indirect names",
    JSON.stringify(readHeroImages(listSource).urls) === JSON.stringify(["/images/home/a.webp", "/images/home/b.webp"]),
    readHeroImages(listSource).urls,
  ]);
  cases.push([
    "the module reader fails when the export is gone",
    readHeroImages("export const NOTHING = 1;").errors.length > 0,
    readHeroImages("export const NOTHING = 1;").errors,
  ]);

  let failed = 0;
  for (const [label, passed, detail] of cases) {
    console.log(`  ${passed ? "ok  " : "FAIL"}  ${label}`);
    if (!passed) {
      failed += 1;
      console.log(`        ${JSON.stringify(detail)}`);
    }
  }
  console.log(`\n${cases.length - failed}/${cases.length} self-test cases passed`);
  if (failed > 0) {
    console.error("FATAL: the hero-weight guard cannot tell a good file from a bad one");
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Live check.
// ---------------------------------------------------------------------------
function main() {
  if (!existsSync(HERO_MODULE)) {
    console.error(`FATAL: ${path.relative(ROOT, HERO_MODULE)} does not exist`);
    process.exit(1);
  }
  const { errors, urls } = readHeroImages(readFileSync(HERO_MODULE, "utf8"));
  for (const error of errors) fail(error);
  if (urls.length === 0) fail("HERO_BG_IMAGES names no image");

  for (const [index, url] of urls.entries()) {
    const label = `HERO_BG_IMAGES[${index}] (${url})`;
    if (/^https?:\/\//i.test(url)) {
      fail(`${label}: the hero must be served from this origin, not from ${new URL(url).origin}`);
      continue;
    }
    const file = path.join(ROOT, "public", url.replace(/^\//, ""));
    if (!existsSync(file)) {
      fail(`${label}: ${path.relative(ROOT, file)} does not exist`);
      continue;
    }
    const buffer = readFileSync(file);
    const issues = judgeHero(label, {
      exists: true,
      header: readWebpHeader(buffer),
      bytes: buffer.length,
    });
    for (const issue of issues) fail(issue);
    if (issues.length === 0) {
      const { width, height } = readWebpHeader(buffer);
      ok(`${label}: ${width}x${height}, ${(buffer.length / 1024).toFixed(1)} KiB`);
    }

    // The document ships this hero with a second candidate (item 27 asks for
    // two, and a small screen should not download the 768 file). The sibling
    // is judged by the same rules at its own width, because "small" is only a
    // saving if it is actually small.
    const smallUrl = smallSiblingOf(url);
    if (!smallUrl) {
      fail(`${label}: its name carries no -768 suffix, so no small candidate can be derived`);
      continue;
    }
    const smallFile = path.join(ROOT, "public", smallUrl.replace(/^\//, ""));
    if (!existsSync(smallFile)) {
      fail(`${label}: the second candidate ${smallUrl} does not exist - the document asks for it`);
      continue;
    }
    const smallBuffer = readFileSync(smallFile);
    const smallIssues = judgeHero(`${label} small`, {
      exists: true,
      header: readWebpHeader(smallBuffer),
      bytes: smallBuffer.length,
    }, { expectedWidth: SMALL_WIDTH, maxBytes: SMALL_MAX_BYTES });
    for (const issue of smallIssues) fail(issue);
    if (smallIssues.length === 0) {
      const { width, height } = readWebpHeader(smallBuffer);
      ok(`${label} small: ${width}x${height}, ${(smallBuffer.length / 1024).toFixed(1)} KiB`);
    }
  }

  for (const note of notes) console.log(`  ok    ${note}`);
  for (const problem of problems) console.error(`  FAIL  ${problem}`);
  if (problems.length > 0) {
    console.error(`\n${problems.length} problem(s): the homepage hero no longer fits its paint budget`);
    process.exit(1);
  }
  console.log(`\n${urls.length} hero image(s) within budget`);
}

if (process.argv.includes("--self-test")) selfTest();
else main();
