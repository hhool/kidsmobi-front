#!/usr/bin/env node
/**
 * Generate the raster favicon set from public/favicon.svg.
 *
 * Why this exists (2026-10-27): Google Search kept showing the default grey
 * globe for every result. Two causes, both visible on the live site:
 *   1. The only declared icon was an SVG, and SVG is absent from the format
 *      list Google documents for search favicons (BMP, GIF, ICO, PNG, JPEG,
 *      PPM, TIFF).
 *   2. /favicon.ico returned 404. That root file is the host-level fallback
 *      Google (and every legacy browser) probes when it wants an icon.
 * So we rasterise the existing vector into the sizes Google actually accepts.
 *
 * Sizes are multiples of 48 (48/96/144/192) because Google's older, still
 * widely enforced rule is "a square whose side is a multiple of 48px". 512 is
 * added for the web manifest and the schema.org Organization logo, which asks
 * for a square raster >= 112px.
 *
 * Rendering goes through the Chromium that Playwright already pulls for the
 * perf scripts, so each size is rasterised straight from the vector at its
 * final pixel dimensions -- no intermediate bitmap, no new dependency.
 *
 * Usage: npm run favicons:generate
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");
const svgSource = readFileSync(join(publicDir, "favicon.svg"), "utf8");

/** PNG variants declared in <head>. All multiples of 48. */
const PNG_SIZES = [48, 96, 144, 192, 512];
/** Sizes packed into favicon.ico (legacy tabs use 16, Google accepts 48). */
const ICO_SIZES = [16, 32, 48];
/** Apple home-screen icon, per Apple's own spec (not a 48 multiple). */
const APPLE_SIZE = 180;

/**
 * Pack PNG buffers into a multi-size .ico container.
 * Vista+ (and therefore everything current) reads PNG-compressed entries.
 */
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);

  const directory = Buffer.alloc(16 * entries.length);
  let offset = 6 + 16 * entries.length;

  entries.forEach((entry, index) => {
    const base = index * 16;
    // 0 encodes 256 in the single-byte width/height fields.
    const dimension = entry.size >= 256 ? 0 : entry.size;
    directory.writeUInt8(dimension, base + 0); // width
    directory.writeUInt8(dimension, base + 1); // height
    directory.writeUInt8(0, base + 2); // palette colours
    directory.writeUInt8(0, base + 3); // reserved
    directory.writeUInt16LE(1, base + 4); // colour planes
    directory.writeUInt16LE(32, base + 6); // bits per pixel
    directory.writeUInt32LE(entry.png.length, base + 8);
    directory.writeUInt32LE(offset, base + 12);
    offset += entry.png.length;
  });

  return Buffer.concat([header, directory, ...entries.map((entry) => entry.png)]);
}

async function launchBrowser() {
  let lastError;
  for (const options of [{ channel: "chrome" }, {}]) {
    try {
      return await chromium.launch(options);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function main() {
  // Playwright's bundled browser isn't downloaded on the dev box (only the npm
  // package is, for the perf scripts), but a local Chrome is. Prefer that, and
  // fall back to a Playwright-managed download when one exists (CI).
  const browser = await launchBrowser();
  const page = await browser.newPage();

  /**
   * Rasterise the vector at an exact pixel size. The SVG carries a viewBox but
   * no intrinsic width/height, so both are injected to pin the render box.
   */
  async function renderPng(size) {
    const markup = svgSource.replace(
      /<svg\b/,
      `<svg width="${size}" height="${size}"`,
    );
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(
      `<!doctype html><html><body style="margin:0;padding:0;background:transparent">${markup}</body></html>`,
      { waitUntil: "load" },
    );
    return page.screenshot({ omitBackground: true, type: "png" });
  }

  const pngs = new Map();
  for (const size of PNG_SIZES) {
    const png = await renderPng(size);
    pngs.set(size, png);
    writeFileSync(join(publicDir, `favicon-${size}x${size}.png`), png);
    console.log(`  favicon-${size}x${size}.png  ${png.length} bytes`);
  }

  const apple = await renderPng(APPLE_SIZE);
  writeFileSync(join(publicDir, "apple-touch-icon.png"), apple);
  console.log(`  apple-touch-icon.png  ${apple.length} bytes (${APPLE_SIZE}px)`);

  const icoEntries = [];
  for (const size of ICO_SIZES) {
    const png = pngs.get(size) ?? (await renderPng(size));
    icoEntries.push({ size, png });
  }
  const ico = buildIco(icoEntries);
  writeFileSync(join(publicDir, "favicon.ico"), ico);
  console.log(
    `  favicon.ico  ${ico.length} bytes (${ICO_SIZES.join("/")})`,
  );

  await browser.close();
  console.log("favicon set written to public/");
}

main().catch((error) => {
  console.error("favicon generation failed:", error);
  process.exit(1);
});
