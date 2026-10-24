#!/usr/bin/env node
/**
 * Every article cover must show the WHOLE source picture.
 *
 * The rule this guard enforces: a cover is a square canvas that contains the
 * complete source image, scaled to fit. The picture region must have the
 * SAME aspect ratio as the source, and the source's long side must be scaled
 * to exactly fill the canvas. That is what "contains the whole picture"
 * means geometrically, and it is checkable without decoding the artwork.
 *
 * Why a guard is needed at all: two passes shipped covers that cut the
 * subject off, and in both cases the crop was invisible in review because
 * the page renders the cover with `object-contain` - which letterboxes a
 * cropped file exactly as happily as an uncropped one. The first 1:1 pass
 * centre-cropped 45 of the 56 guide sources to a square before scaling them
 * down, deleting up to 39% of each picture inside the file. Nothing in the
 * DOM, the CSS or the CMS would ever have reported that; only comparing the
 * file against its own source does.
 *
 * What this guard reads:
 *   - scripts/article-cover-geometry.json, written by the cover publisher,
 *     recording each cover's source size, picture size and offset;
 *   - scripts/article-cover-sources.json, the map of slug -> source URL;
 *   - the cover files themselves, to confirm each one exists and is a real
 *     800x800 image rather than a 404 or a stale placeholder.
 *
 * Run: npm run check:covergeometry
 */
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(process.env.COVER_GEOMETRY_ROOT || ".");
const GEOMETRY = join(ROOT, "scripts", "article-cover-geometry.json");
const SOURCES = join(ROOT, "scripts", "article-cover-sources.json");
const CANVAS = 800;

const problems = [];
const fail = (where, msg) => problems.push(`${where} - ${msg}`);

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

/**
 * Read the dimensions of a WebP file from its header.
 * The RIFF container stores the canvas size in the VP8 / VP8L / VP8X chunk
 * header, so the size can be confirmed without an image library.
 */
function webpSize(path) {
  const buf = readFileSync(path);
  if (buf.length < 30) return null;
  if (buf.toString("ascii", 0, 4) !== "RIFF") return null;
  if (buf.toString("ascii", 8, 12) !== "WEBP") return null;

  const chunk = buf.toString("ascii", 12, 16);
  if (chunk === "VP8X") {
    // Extended format: 24-bit canvas width-1 / height-1 at offset 24.
    const w = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
    const h = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
    return { width: w, height: h };
  }
  if (chunk === "VP8L") {
    // Lossless: 14-bit width-1 / height-1, 1 byte after the 0x2F signature.
    const b = buf[21] | (buf[22] << 8) | (buf[23] << 16) | (buf[24] << 24);
    const w = 1 + (b & 0x3fff);
    const h = 1 + ((b >> 14) & 0x3fff);
    return { width: w, height: h };
  }
  if (chunk === "VP8 ") {
    // Lossy: 16-bit width / height after the 3-byte start code.
    const w = (buf[26] | (buf[27] << 8)) & 0x3fff;
    const h = (buf[28] | (buf[29] << 8)) & 0x3fff;
    return { width: w, height: h };
  }
  return null;
}

if (!existsSync(GEOMETRY)) {
  console.error(
    JSON.stringify(
      { ok: false, failed: ["scripts/article-cover-geometry.json missing - run scripts/publish-article-covers.py"] },
      null,
      2,
    ),
  );
  process.exit(1);
}

const geometry = readJson(GEOMETRY);
const sources = readJson(SOURCES);

const expectedSlugs = new Set([
  ...Object.keys(sources.guides || {}),
  ...Object.keys(sources.news || {}),
]);
const covered = new Set(Object.keys(geometry.covers || {}));

for (const slug of expectedSlugs) {
  if (!covered.has(slug)) fail(`cover/${slug}`, "no geometry recorded - the cover was never built");
}
for (const slug of covered) {
  if (!expectedSlugs.has(slug)) fail(`cover/${slug}`, "geometry recorded for a slug that has no source");
}

for (const [slug, meta] of Object.entries(geometry.covers || {})) {
  const [sw, sh] = meta.source || [];
  const [iw, ih] = meta.inner || [];
  const [x0, y0] = meta.offset || [];
  if (!sw || !sh || !iw || !ih) {
    fail(`cover/${slug}`, "geometry record is incomplete");
    continue;
  }

  // 1. The canvas is square and the picture sits inside it.
  if (geometry.canvas !== CANVAS) fail(`cover/${slug}`, `canvas is ${geometry.canvas}, expected ${CANVAS}`);
  if (iw > CANVAS || ih > CANVAS) {
    fail(`cover/${slug}`, `picture ${iw}x${ih} does not fit the ${CANVAS}x${CANVAS} canvas`);
  }

  // 2. THE CROP CHECK. The picture region must have the same aspect ratio as
  //    the source. A centre crop changes the aspect ratio, so this is what
  //    catches "the wheels are gone" even though the file is a valid square.
  const srcAspect = sw / sh;
  const innerAspect = iw / ih;
  if (Math.abs(srcAspect - innerAspect) > 0.02) {
    fail(
      `cover/${slug}`,
      `picture aspect ${innerAspect.toFixed(3)} != source aspect ${srcAspect.toFixed(3)} ` +
        `(source ${sw}x${sh} -> picture ${iw}x${ih}) - the picture was cropped or squashed`,
    );
  }

  // 3. The source's LONG side must be scaled to exactly fill the canvas.
  //    Anything less means the source was shrunk to leave a margin, which is
  //    a different (and unintended) rule.
  const scale = CANVAS / Math.max(sw, sh);
  const expectedInner = [Math.max(1, Math.round(sw * scale)), Math.max(1, Math.round(sh * scale))];
  if (expectedInner[0] !== iw || expectedInner[1] !== ih) {
    fail(
      `cover/${slug}`,
      `picture is ${iw}x${ih}, expected ${expectedInner[0]}x${expectedInner[1]} ` +
        `(source ${sw}x${sh} scaled to fit) - the picture does not fill the canvas`,
    );
  }

  // 4. The picture must be centred in the canvas.
  const expectedOffset = [Math.floor((CANVAS - iw) / 2), Math.floor((CANVAS - ih) / 2)];
  if (x0 !== expectedOffset[0] || y0 !== expectedOffset[1]) {
    fail(`cover/${slug}`, `picture offset ${x0},${y0} is not centred (expected ${expectedOffset.join(",")})`);
  }

  // 5. The file must exist and really be an 800x800 image.
  if (!meta.out) {
    fail(`cover/${slug}`, "geometry record does not say which file it wrote");
    continue;
  }
  const file = join(ROOT, meta.out);
  if (!existsSync(file)) {
    fail(`cover/${slug}`, `cover file missing: ${meta.out}`);
    continue;
  }
  if (statSync(file).size < 4_000) {
    fail(`cover/${slug}`, `cover file is only ${statSync(file).size} bytes - that is not a real image`);
  }
  const size = webpSize(file);
  if (!size) {
    fail(`cover/${slug}`, `cover file is not a readable WebP: ${meta.out}`);
  } else if (size.width !== CANVAS || size.height !== CANVAS) {
    fail(`cover/${slug}`, `cover file is ${size.width}x${size.height}, expected ${CANVAS}x${CANVAS}`);
  }
}

const count = covered.size;
if (problems.length) {
  console.error(JSON.stringify({ ok: false, checked: count, problems }, null, 2));
  process.exit(1);
}
console.log(
  JSON.stringify(
    {
      ok: true,
      checked: count,
      canvas: `${CANVAS}x${CANVAS}`,
      rule: "each cover contains the complete source picture, scaled to fit, aspect ratio preserved",
    },
    null,
    2,
  ),
);
