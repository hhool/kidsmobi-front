#!/usr/bin/env node
/**
 * Guard the favicon set Google Search depends on.
 *
 * Context (2026-10-27): every result showed Google's default grey globe because
 * the site declared only an SVG favicon and /favicon.ico was a 404. Google's
 * documented formats for search favicons are BMP/GIF/ICO/PNG/JPEG/PPM/TIFF --
 * no SVG -- and /favicon.ico at the host root is the fallback it probes.
 *
 * This asserts three things so the regression can't come back silently:
 *   1. the raster assets exist in public/ at the right pixel sizes;
 *   2. 48/96/144/192 stay multiples of 48 (Google's sizing rule) and square;
 *   3. both HTML head sources declare ICO + PNG + manifest, not SVG alone.
 *
 * Run: npm run check:favicons
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");

const problems = [];
const notes = [];

/** png name -> required side length. */
const PNG_REQUIRED = {
  "favicon-48x48.png": 48,
  "favicon-96x96.png": 96,
  "favicon-144x144.png": 144,
  "favicon-192x192.png": 192,
  "favicon-512x512.png": 512,
  "apple-touch-icon.png": 180,
};

/** Sizes that must obey Google's "multiple of 48" rule (512 + Apple aren't). */
const MULTIPLE_OF_48 = new Set([48, 96, 144, 192]);

function readPngSize(name) {
  const buffer = readFileSync(join(publicDir, name));
  const signature = buffer.subarray(0, 8).toString("latin1");
  if (signature !== "\u0089PNG\r\n\u001a\n") {
    problems.push(`${name}: not a PNG (bad signature)`);
    return null;
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

for (const [name, expected] of Object.entries(PNG_REQUIRED)) {
  const path = join(publicDir, name);
  if (!existsSync(path)) {
    problems.push(`${name}: missing from public/ (run npm run favicons:generate)`);
    continue;
  }
  const size = readPngSize(name);
  if (!size) continue;

  if (size.width !== size.height) {
    problems.push(`${name}: not square (${size.width}x${size.height})`);
  }
  if (size.width !== expected || size.height !== expected) {
    problems.push(
      `${name}: is ${size.width}x${size.height}, declared as ${expected}px`,
    );
  }
  if (MULTIPLE_OF_48.has(expected) && expected % 48 !== 0) {
    problems.push(`${name}: ${expected}px is not a multiple of 48`);
  }
}

// --- favicon.ico: valid container with a 48px entry ---
const icoPath = join(publicDir, "favicon.ico");
if (!existsSync(icoPath)) {
  problems.push("favicon.ico: missing from public/ (Google probes /favicon.ico)");
} else {
  const ico = readFileSync(icoPath);
  if (ico.length < 6) {
    problems.push("favicon.ico: truncated header");
  } else {
    const type = ico.readUInt16LE(2);
    const count = ico.readUInt16LE(4);
    if (type !== 1) problems.push(`favicon.ico: type is ${type}, expected 1 (icon)`);
    if (count < 1) problems.push("favicon.ico: contains no images");

    const sizes = [];
    for (let index = 0; index < count; index += 1) {
      const base = 6 + index * 16;
      if (base + 16 > ico.length) {
        problems.push(`favicon.ico: entry ${index} runs past end of file`);
        break;
      }
      sizes.push(ico.readUInt8(base) || 256);
      const size = ico.readUInt32LE(base + 8);
      const offset = ico.readUInt32LE(base + 12);
      if (offset + size > ico.length) {
        problems.push(`favicon.ico: entry ${index} data out of bounds`);
      }
    }
    if (sizes.length && !sizes.includes(48)) {
      problems.push(`favicon.ico: no 48px entry (has ${sizes.join("/")})`);
    }
    notes.push(`favicon.ico entries: ${sizes.join("/")}`);
  }
}

// --- both head sources must declare the raster set ---
const HEAD_SOURCES = [
  { file: "index.html", label: "SPA index.html" },
  { file: "scripts/prerender-pages.ts", label: "prerender template" },
];

for (const { file, label } of HEAD_SOURCES) {
  const path = join(root, file);
  if (!existsSync(path)) {
    problems.push(`${file}: missing (${label})`);
    continue;
  }
  const html = readFileSync(path, "utf8");
  const checks = [
    ['rel="icon" href="/favicon.ico"', "ICO link"],
    ['type="image/png" sizes="48x48"', "48px PNG link"],
    ['rel="manifest"', "web manifest link"],
    ['rel="apple-touch-icon"', "apple-touch-icon link"],
  ];
  for (const [needle, label2] of checks) {
    if (!html.includes(needle)) {
      problems.push(`${file} (${label}): missing ${label2} (${needle})`);
    }
  }
  // The original bug: SVG as the only icon declaration.
  if (!html.includes("favicon-48x48.png")) {
    problems.push(`${file} (${label}): declares no raster favicon`);
  }
}

if (existsSync(join(publicDir, "site.webmanifest"))) {
  try {
    const manifest = JSON.parse(
      readFileSync(join(publicDir, "site.webmanifest"), "utf8"),
    );
    const iconSizes = (manifest.icons ?? []).map((icon) => icon.sizes);
    if (!iconSizes.includes("192x192")) {
      problems.push("site.webmanifest: no 192x192 icon");
    }
    notes.push(`manifest icons: ${iconSizes.join(", ")}`);
  } catch (error) {
    problems.push(`site.webmanifest: invalid JSON (${error.message})`);
  }
} else {
  problems.push("site.webmanifest: missing from public/");
}

for (const note of notes) console.log(`  ${note}`);

if (problems.length > 0) {
  console.error("\nfavicon guard FAILED:");
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(
  `favicon guard OK (${Object.keys(PNG_REQUIRED).length} rasters + ico + manifest)`,
);
