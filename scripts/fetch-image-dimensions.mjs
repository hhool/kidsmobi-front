/**
 * Fill in the intrinsic size of every article cover.
 *
 * G4 row 20 (repos/wb-seo-teardown/references/technical-baseline-34.md) asks
 * for every <img> to carry alt text AND explicit dimensions. The article hero
 * carries neither, and it cannot simply declare 800x800: the hero shows the
 * ORIGINAL artwork (a 1500x1384 photo on one guide, an 800x450 editorial
 * illustration on another), so a guessed ratio reserves the wrong box and the
 * page shifts when the image lands — the layout shift row 25 measures.
 *
 * So the sizes are MEASURED, once, and stored here:
 *
 *   scripts/image-dimensions.json   { "<image url>": [width, height] }
 *
 * The build reads that file. It does not fetch anything, so the build stays
 * offline and reproducible (row 34 asks for a byte-identical rebuild).
 *
 * Run: node scripts/fetch-image-dimensions.mjs
 *
 * Sources of truth:
 *   - a site-relative path (/images/...) is read off disk under public/
 *   - a remote URL is fetched with a Range request and its header parsed
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const SNAPSHOTS = ["guides", "news"];
const OUT = "scripts/image-dimensions.json";
const RANGE_BYTES = 65536;

/** Read a PNG/JPEG/WebP header and return [width, height]. */
export function imageSize(buf) {
  if (buf.length > 24 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    // PNG: the IHDR chunk starts at byte 8; width/height are big-endian uint32.
    return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
  }
  if (buf.length > 30 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    const chunk = buf.toString("ascii", 12, 16);
    if (chunk === "VP8X") {
      const w = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
      const h = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
      return [w, h];
    }
    if (chunk === "VP8 ") {
      // Lossy: the frame header holds a 14-bit width/height at a fixed offset.
      return [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff];
    }
    if (chunk === "VP8L") {
      const bits = buf.readUInt32LE(21);
      return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1];
    }
  }
  // JPEG: walk the marker segments until a start-of-frame carries the size.
  let i = 2;
  while (i < buf.length - 9) {
    if (buf[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = buf[i + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    if (marker === 0xd9 || marker === 0xda) break;
    const length = buf.readUInt16BE(i + 2);
    const isSof = [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker);
    if (isSof) return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)];
    i += 2 + length;
  }
  return null;
}

function snapshotItems(name) {
  const path = join("scripts", "cms-snapshots", `${name}.json`);
  const raw = JSON.parse(readFileSync(path, "utf8"));
  const items = Array.isArray(raw) ? raw : raw.items || raw.records || raw.data || [];
  return items;
}

async function remoteSize(url) {
  const response = await fetch(url, { headers: { Range: `bytes=0-${RANGE_BYTES - 1}` } });
  if (!response.ok && response.status !== 206) {
    throw new Error(`HTTP ${response.status}`);
  }
  const buf = Buffer.from(await response.arrayBuffer());
  return imageSize(buf);
}

async function main() {
  const wanted = new Map();
  for (const name of SNAPSHOTS) {
    for (const item of snapshotItems(name)) {
      const url = String(item.imageUrl || "").trim();
      if (url) wanted.set(url, item.slug || item.id || url);
    }
  }

  const out = {};
  const failed = [];
  for (const [url, slug] of wanted) {
    try {
      let size = null;
      if (url.startsWith("/")) {
        const path = join("public", url.replace(/^\//, ""));
        if (!existsSync(path)) throw new Error(`not on disk: ${path}`);
        size = imageSize(readFileSync(path));
      } else {
        size = await remoteSize(url);
      }
      if (!size) throw new Error("no size in header");
      out[url] = size;
    } catch (error) {
      failed.push(`${slug} :: ${url} :: ${error.message}`);
    }
  }

  writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`, "utf8");
  console.log(`[image-dimensions] ${Object.keys(out).length}/${wanted.size} measured -> ${OUT}`);
  if (failed.length) {
    console.error(`[image-dimensions] ${failed.length} failure(s):`);
    for (const line of failed) console.error(`  - ${line}`);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith("fetch-image-dimensions.mjs")) {
  main();
}
