#!/usr/bin/env node
/**
 * Visual parity check: the static homepage against the SPA homepage.
 *
 * Why this exists
 * ---------------
 * The homepage ships as a static document, and the whole point of doing it
 * that way was that the document has to LOOK like the page the SPA paints.
 * The earlier static-home variant that measured LCP 1211 ms was the SEO
 * article page - Arial inline styles, a different page - so it was a
 * performance win bought with a UI/UX regression.
 *
 * So the claim has to be checked, not asserted: the same viewport, the same
 * assets, the same fonts, two documents, one pixel diff.
 *
 * What it compares
 * ----------------
 *   - the production homepage: the PRERENDERED document (the boot cover,
 *     the takeover script, the body's class list and the inline critical
 *     CSS) after React has painted the homepage over it. This is the page
 *     a reader receives today, so it is the only honest reference.
 *
 *     It is NOT the bare Vite shell: that shell has no inline CSS and no
 *     body classes, so it paints a different backdrop and a different text
 *     colour - a difference of 1.5% of the pixels that has nothing to do
 *     with the delivery mechanism.
 *   - the static homepage: the assembled document.
 *
 * Both are served from the SAME directory, so the assets, the fonts and the
 * images are byte-identical between the two runs. Only the document differs.
 *
 * The comparison is a real pixel diff: the PNGs are decoded (zlib + the PNG
 * filters, no image library) and the pixels are compared one by one with a
 * small per-channel tolerance, because a font rasteriser can differ by a
 * shade on an antialiased edge.
 *
 * Usage:
 *   node scripts/check-home-parity.mjs --spa .runs/home-ssr/prerendered-home.html \
 *     --static dist/index.html --dist dist --out .runs/parity
 *   node scripts/check-home-parity.mjs --self-test
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, mkdtempSync, rmSync } from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";

function readArg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ico": "image/x-icon",
  ".xml": "application/xml; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

/* ------------------------------------------------------------------ PNG */

/**
 * Decode a PNG into raw RGBA pixels.
 *
 * Only what a screenshot needs: 8 bits per channel, no interlacing, colour
 * type 2 (RGB) or 6 (RGBA). Returns { width, height, data } where data is
 * width * height * 4 bytes.
 */
export function decodePng(buffer) {
  if (buffer.readUInt32BE(0) !== 0x89504e47) throw new Error("not a PNG");
  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = 6;
  let bitDepth = 8;
  const idat = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const start = offset + 8;
    if (type === "IHDR") {
      width = buffer.readUInt32BE(start);
      height = buffer.readUInt32BE(start + 4);
      bitDepth = buffer[start + 8];
      colorType = buffer[start + 9];
      const interlace = buffer[start + 12];
      if (bitDepth !== 8) throw new Error(`unsupported bit depth ${bitDepth}`);
      if (interlace !== 0) throw new Error("interlaced PNG is not supported");
      if (colorType !== 2 && colorType !== 6) {
        throw new Error(`unsupported colour type ${colorType}`);
      }
    } else if (type === "IDAT") {
      idat.push(buffer.subarray(start, start + length));
    } else if (type === "IEND") {
      break;
    }
    offset = start + length + 4;
  }

  const channels = colorType === 6 ? 4 : 3;
  const stride = width * channels;
  const inflated = zlib.inflateSync(Buffer.concat(idat));
  const pixels = Buffer.alloc(width * height * 4);

  let source = 0;
  let previous = Buffer.alloc(stride);
  for (let y = 0; y < height; y += 1) {
    const filter = inflated[source];
    source += 1;
    const line = Buffer.from(inflated.subarray(source, source + stride));
    source += stride;
    for (let x = 0; x < stride; x += 1) {
      const a = x >= channels ? line[x - channels] : 0;
      const b = previous[x];
      const c = x >= channels ? previous[x - channels] : 0;
      let value = line[x];
      if (filter === 1) value = (value + a) & 0xff;
      else if (filter === 2) value = (value + b) & 0xff;
      else if (filter === 3) value = (value + ((a + b) >> 1)) & 0xff;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        value = (value + pred) & 0xff;
      }
      line[x] = value;
    }
    for (let x = 0; x < width; x += 1) {
      pixels[(y * width + x) * 4 + 0] = line[x * channels + 0];
      pixels[(y * width + x) * 4 + 1] = line[x * channels + 1];
      pixels[(y * width + x) * 4 + 2] = line[x * channels + 2];
      pixels[(y * width + x) * 4 + 3] = channels === 4 ? line[x * channels + 3] : 255;
    }
    previous = line;
  }

  return { width, height, data: pixels };
}

/**
 * The share of pixels that differ by more than the tolerance.
 *
 * The tolerance is per channel and small: it absorbs the difference between
 * two runs of the same antialiased text, and nothing else. A different
 * layout, a different colour or a missing element moves whole blocks of
 * pixels and shows up immediately.
 *
 * When the two screenshots have different heights, the comparison runs over
 * the region they share and the height difference is reported separately.
 * A full-page screenshot of a document that is 48px taller is not "100%
 * different" - it is "the same page, 48px longer", and that has to be
 * visible as a number rather than as a false alarm.
 */
export function diffRatio(a, b, tolerance = 8) {
  if (a.width !== b.width) {
    return { ratio: 1, differing: Infinity, total: 0, note: "the two screenshots have different widths" };
  }
  const height = Math.min(a.height, b.height);
  const total = a.width * height;
  let differing = 0;
  for (let i = 0; i < total; i += 1) {
    const o = i * 4;
    const dr = Math.abs(a.data[o] - b.data[o]);
    const dg = Math.abs(a.data[o + 1] - b.data[o + 1]);
    const db = Math.abs(a.data[o + 2] - b.data[o + 2]);
    const da = Math.abs(a.data[o + 3] - b.data[o + 3]);
    if (dr > tolerance || dg > tolerance || db > tolerance || da > tolerance) differing += 1;
  }
  return {
    ratio: differing / total,
    differing,
    total,
    heightDelta: b.height - a.height,
    comparedHeight: height,
  };
}

/* --------------------------------------------------------------- browser */

/**
 * Find a Chromium that is actually on disk.
 *
 * Playwright pins an exact browser build. When the installed build is older
 * than the one this Playwright wants, `chromium.launch()` fails with
 * "Executable doesn't exist" even though a perfectly good Chromium is
 * sitting in the cache - so the cache is searched for the newest one and
 * used directly. A patch-level difference does not change what a
 * screenshot looks like; it only changes the binary.
 */
export function resolveChromium(chromium) {
  const preferred = chromium.executablePath();
  if (existsSync(preferred)) return preferred;

  const roots = [
    path.join(process.env.HOME || "", "Library/Caches/ms-playwright"),
    path.join(process.env.HOME || "", ".cache/ms-playwright"),
  ];
  const candidates = [];
  for (const root of roots) {
    if (!existsSync(root)) continue;
    for (const entry of readdirSync(root)) {
      if (!/^chromium(_headless_shell)?-\d+$/.test(entry)) continue;
      const dir = path.join(root, entry);
      for (const rel of [
        "chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
        "chrome-mac/Chromium.app/Contents/MacOS/Chromium",
        "chrome-linux/chrome",
        "chrome-headless-shell-mac-x64/chrome-headless-shell",
        "chrome-headless-shell-linux64/chrome-headless-shell",
      ]) {
        const candidate = path.join(dir, rel);
        if (existsSync(candidate)) candidates.push(candidate);
      }
    }
  }
  if (!candidates.length) {
    throw new Error(
      `no Chromium on disk (wanted ${preferred}) - run "npx playwright install chromium"`,
    );
  }
  candidates.sort();
  return candidates[candidates.length - 1];
}

/* --------------------------------------------------------------- server */

/**
 * The CMS content, served to the SPA from the same snapshot the static
 * document was built from.
 *
 * Without this the comparison is meaningless: the SPA asks the Worker for
 * its content, the Worker is not reachable from the comparison server, and
 * the SPA falls back to the DEMO products bundled in the JavaScript - while
 * the static document carries the real CMS products. The two would then show
 * different products, and the diff would measure the data instead of the
 * delivery mechanism.
 *
 * So the two endpoints the SPA calls are answered from the same snapshot the
 * build uses, and both halves of the comparison then render the same
 * content.
 *
 * The endpoint that matters is /api/cms/products - that is the SPA's PRIMARY
 * product source (App.tsx calls getD1CMSProducts(true) first). Leaving it
 * unanswered makes the SPA fall back to /api/v2/products, which the real API
 * serves one category at a time, so the homepage's five product rows come
 * back empty and the comparison measures a degraded SPA against a complete
 * document. That is how this harness first reported a 39.6% difference on
 * two pages that are actually the same page.
 */
export function cmsStub(snapshotDir) {
  const read = (name) => {
    const file = path.join(snapshotDir, name);
    if (!existsSync(file)) return null;
    return JSON.parse(readFileSync(file, "utf8"));
  };
  const products = read("products.json") || [];
  const settings = read("settings.json");
  const evaluations = read("evaluations.json");
  const guides = read("guides.json");
  const news = read("news.json");
  const categories = [];
  const seen = new Set();
  for (const product of products) {
    const id = String(product.categoryId || product.category || "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    categories.push({ categoryId: id, defaultLimit: 12, label: id });
  }
  return { products, settings, evaluations, guides, news, categories };
}

export function startServer(distDir, variants, snapshotDir) {
  const stub = snapshotDir ? cmsStub(snapshotDir) : null;
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    let pathname = decodeURIComponent(url.pathname);

    // The content endpoints, answered from the build's own snapshot.
    if (stub && pathname.startsWith("/api/")) {
      const send = (payload) => {
        const body = JSON.stringify(payload);
        res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
        res.end(body);
      };
      // The CMS endpoints the SPA calls on the homepage. Answering them from
      // the same snapshot the static document was built from is what makes
      // the two halves of the comparison show the same products.
      if (pathname.startsWith("/api/cms/settings")) return send(stub.settings);
      if (pathname.startsWith("/api/cms/products")) {
        return send({ data: stub.products.filter((p) => String(p.status || "") === "published") });
      }
      if (pathname.startsWith("/api/cms/categories")) return send({ data: stub.categories });
      if (pathname.startsWith("/api/cms/evaluations")) return send({ data: stub.evaluations || [] });
      if (pathname.startsWith("/api/cms/guides")) return send({ data: stub.guides || [] });
      if (pathname.startsWith("/api/cms/news")) return send({ data: stub.news || [] });
      // The Worker-shaped endpoints the SPA falls back to. The public
      // catalog only serves published rows, so the draft rows are dropped
      // here as well.
      if (pathname.startsWith("/api/v2/categories")) return send({ data: stub.categories });
      if (pathname.startsWith("/api/v2/products") || pathname.startsWith("/api/v1/products")) {
        const wanted = url.searchParams.get("categoryId") || "";
        const data = stub.products.filter(
          (p) =>
            String(p.status || "") === "published" &&
            String(p.categoryId || p.category || "") === wanted,
        );
        return send({ data });
      }
      res.writeHead(404).end("not found");
      return;
    }
    if (pathname === "/" || pathname === "/index.html") {
      const key = url.searchParams.get("variant") || "static";
      const file = variants[key];
      if (!file) {
        res.writeHead(404).end("no such variant");
        return;
      }
      const body = readFileSync(file);
      res.writeHead(200, { "content-type": MIME[".html"], "cache-control": "no-store" });
      res.end(body);
      return;
    }
    const filePath = path.join(distDir, pathname.replace(/^\/+/, ""));
    if (!filePath.startsWith(path.resolve(distDir)) || !existsSync(filePath)) {
      res.writeHead(404).end("not found");
      return;
    }
    const type = MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "content-type": type, "cache-control": "no-store" });
    res.end(readFileSync(filePath));
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port }));
  });
}

/* --------------------------------------------------------------- check */

/**
 * The hostname the comparison runs under.
 *
 * The app decides which brand theme to paint from the hostname: on
 * balancebiketoddler.com it renders the BBT brand and the breadcrumb, and
 * anywhere else it renders the other theme. The static document is built
 * with the production hostname (src/ssr/home-entry.tsx), so the SPA half of
 * the comparison has to run under a hostname that includes it as well -
 * otherwise the two are not the same page and the diff measures the theme
 * switch instead of the delivery mechanism.
 *
 * The hostname is mapped to the loopback address by Chromium's resolver
 * rule, so no DNS and no /etc/hosts edit is needed.
 */
const PARITY_HOST = "balancebiketoddler.localtest.me";

/**
 * Wait until the page stops changing shape.
 *
 * The SPA renders in pieces: React mounts, the product data arrives, the
 * cards fill in, the images load and the page grows. A screenshot taken
 * while that is still happening compares a half-built page against a
 * finished one, and the diff then measures the timing rather than the
 * design. So the document height is polled until it has stopped moving.
 */
async function waitForStableLayout(page, { intervalMs = 250, stableReads = 4, timeoutMs = 20000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  let last = -1;
  let stable = 0;
  while (Date.now() < deadline) {
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    if (height === last) {
      stable += 1;
      if (stable >= stableReads) return height;
    } else {
      stable = 0;
      last = height;
    }
    await page.waitForTimeout(intervalMs);
  }
  return last;
}

/**
 * Pin the hero to its FIRST frame.
 *
 * The hero is a crossfading background carousel: the SPA rotates through
 * the photographs, the document ships the first one. That is a deliberate
 * product difference (one frame instead of a rotating set), and it is the
 * one difference the comparison cannot see on its own - by the time the
 * screenshot is taken the SPA has usually rotated to another photograph,
 * and a full-bleed photo that differs is a 40-65% pixel difference in the
 * hero band.
 *
 * So both halves are pinned to the same frame before the screenshot: the
 * first slide at its own opacity, every other slide at zero. The rule
 * "the two halves show the same frame of the same carousel" is checked;
 * the rule "the SPA keeps rotating" is not, because it is a different
 * object on purpose.
 *
 * The slides are found by the photograph they carry: an inline
 * background-image on a div, or an <img> inside the hero. The rule is "this
 * element shows a hero photograph", and the shape of the element is not the
 * rule - the hero became an <img> because a CSS background-image is a weak
 * Largest Contentful Paint candidate (see src/components/HomeSection.tsx).
 * The gradient overlay and the two glow blobs share the same container and
 * are not slides, which is what the filter below excludes.
 */
async function pinHeroFrame(page) {
  return page.evaluate(() => {
    // A FRAME is a photograph: an <img>, or (the old shape) a div whose
    // background is a url(). The hero also carries two ambient glows as
    // radial gradients, and those must not be pinned to opacity 0 - doing
    // that hides them on both halves and quietly removes them from the
    // comparison.
    const isFrame = (el) =>
      el.tagName === "IMG" ? true : /url\(/.test((el.style && el.style.backgroundImage) || "");
    const slides = Array.from(
      document.querySelectorAll("#home_banner_anchor div, #home_banner_anchor img"),
    ).filter(isFrame);
    // The pin has to SURVIVE the app. React re-renders the carousel's
    // opacity every time the frame advances, and a plain inline assignment
    // loses that race: the next render overwrites the pin and the
    // screenshot catches a different photograph. Setting the property as
    // important and re-applying it from a mutation observer makes the
    // observer callback run before the next paint, so the painted frame is
    // always the pinned one.
    const apply = () => {
      slides.forEach((slide, index) => {
        slide.style.setProperty("transition", "none", "important");
        slide.style.setProperty("opacity", index === 0 ? "0.62" : "0", "important");
      });
    };
    apply();
    const observer = new MutationObserver(apply);
    for (const slide of slides) {
      observer.observe(slide, { attributes: true, attributeFilter: ["style"] });
    }
    window.__bbtHeroPin = { apply, observer };
    return slides.length;
  });
}

async function capture(browser, url, viewport, outDir, name) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    locale: "en-US",
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "load", timeout: 60000 });
  // The SPA needs its bundle; the document does not. Both need the fonts and
  // the images before a screenshot means anything.
  await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {});
  // The production homepage hands the page over from the prerendered markup
  // to React. Until it does, the page shows the prerendered article, and a
  // screenshot of that is not the homepage. The document half carries the
  // hero from the first byte.
  await page.waitForSelector("#home_banner_anchor", { state: "attached", timeout: 45000 });
  await page.evaluate(() => (document.fonts ? document.fonts.ready : Promise.resolve()));
  // The static homepage used to keep the sections below the hero out of
  // layout (`content-visibility: auto` + `contain-intrinsic-size: auto
  // 800px`), on the belief that laying out the whole document before the
  // first paint was what the Total Blocking Time budget was spent on. That
  // belief was measured and was wrong twice over: paired interleaved runs put
  // LCP at 1742 ms with the rule against 1740 ms without (neutral) and TBT at
  // 174 ms against 70 ms (the rule COST ~104 ms), and a skipped section
  // reports its 800 px placeholder as its box while its children are still
  // laid out - so the FAQ's 1392 px of content spilled over the footer and
  // took accessibility to 0.96.
  //
  // The rule is gone. This harness used to force every skipped subtree
  // visible before the screenshot, which is exactly why no gate ever saw the
  // broken page: the comparison was made in a state no reader gets. So the
  // accommodation is now an assertion - if the delivered document skips a
  // subtree, the comparison is not of the delivered page and the run fails.
  //
  // The SPA half has no such rule, so nothing is forced there either; forcing
  // it on one half only would compare two different layouts.
  const forcedVisible = await page.evaluate(() => {
    let count = 0;
    for (const element of document.querySelectorAll("*")) {
      const style = window.getComputedStyle(element);
      if (style.contentVisibility && style.contentVisibility !== "visible") {
        element.style.setProperty("content-visibility", "visible", "important");
        count += 1;
      }
    }
    return count;
  });
  if (forcedVisible > 0) {
    if (name.startsWith("static")) {
      throw new Error(
        `${name}: the delivered document skips ${forcedVisible} subtree(s) (content-visibility), ` +
          "so its own height is a placeholder and its content overlaps what follows. " +
          "A screenshot of that is not the page the reader gets.",
      );
    }
    console.log(`    ${name}: forced ${forcedVisible} skipped subtree(s) into layout before the screenshot`);
  }
  const height = await waitForStableLayout(page);
  await page.waitForTimeout(600);
  const slides = await pinHeroFrame(page);
  // The homepage's pictures are lazy: they are fetched when the reader gets
  // to them, not before. A full-page screenshot does not scroll, so both
  // halves would show empty grey boxes where the product photographs are -
  // and the comparison would be between two half-empty pages, which is a
  // weaker claim than "the reader cannot tell them apart".
  //
  // So the harness makes every picture eager and waits for it. Both halves
  // are then compared in the state a reader sees after scrolling, which is
  // the state that has to look the same.
  const loaded = await page.evaluate(async () => {
    const images = Array.from(document.querySelectorAll("img"));
    images.forEach((img) => {
      img.loading = "eager";
    });
    await Promise.all(
      images.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) {
              resolve();
              return;
            }
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", resolve, { once: true });
          }),
      ),
    );
    return images.filter((img) => img.naturalWidth > 0).length;
  });
  const file = path.join(outDir, `${name}.png`);
  // animations: "disabled" finishes the CSS animations and freezes them at
  // their first frame, so the two halves are compared at the same point of
  // every pulse. Without it the comparison is a race between two clock
  // phases and the hero's decorative blobs alone account for a few percent.
  await page.screenshot({ path: file, fullPage: true, animations: "disabled" });
  const info = await page.evaluate(() => ({
    height: document.documentElement.scrollHeight,
    title: document.title,
    h1: (document.querySelector("h1") || {}).textContent || "",
    // The number of IMAGES is the cheapest honest signal that the two halves
    // rendered the same content. It is structural, so it does not depend on
    // whether a picture happened to load.
    //
    // The hero's frames are counted SEPARATELY, by the rule below: the SPA
    // renders the whole carousel (two photographs, so the change is a fade)
    // and the document deliberately ships one. Counting the hero here would
    // turn that intended difference into a content mismatch and mask a real
    // one, so the count starts outside the hero.
    images: Array.from(document.querySelectorAll("img")).filter(
      (img) => !img.closest("#home_banner_anchor"),
    ).length,
    // How many of them actually carry pixels. A lazy picture that was never
    // scrolled to would be counted as an image but show nothing, so the
    // count of loaded ones is the honest signal.
    imagesLoaded: Array.from(document.querySelectorAll("img")).filter(
      (img) => !img.closest("#home_banner_anchor") && img.naturalWidth > 0,
    ).length,
    // The hero's first frame: the photograph the document ships. It has to
    // be the same one the SPA shows first, and the document has to ship
    // exactly one frame (the SPA rotates, the document does not).
    heroFirst: (() => {
      const slides = Array.from(
        document.querySelectorAll("#home_banner_anchor div, #home_banner_anchor img"),
      ).filter((el) =>
        el.tagName === "IMG" ? true : Boolean(el.style && el.style.backgroundImage),
      );
      if (!slides.length) return "";
      const first = slides[0];
      return first.tagName === "IMG" ? first.getAttribute("src") || "" : first.style.backgroundImage;
    })(),
    heroSlides: Array.from(
      document.querySelectorAll("#home_banner_anchor div, #home_banner_anchor img"),
    ).filter((el) =>
      // An <img> is a frame. A div is a frame only if its background is a
      // PHOTOGRAPH - the hero used to be built that way. It now carries two
      // ambient glows as radial gradients, and counting those as frames would
      // make the document look like it ships three photographs when it ships
      // one.
      el.tagName === "IMG" ? true : Boolean(el.style && /url\(/.test(el.style.backgroundImage || "")),
    ).length,
    landmarks: Array.from(document.querySelectorAll("header,nav,main,section,footer"))
      .map((el) => `${el.tagName}#${el.id || "-"}`)
      .join(","),
  }));
  await context.close();
  return { file, buffer: readFileSync(file), info, settledHeight: height, heroSlides: slides };
}

async function runCheck() {
  const spaPath = readArg("--spa", "");
  const staticPath = readArg("--static", "");
  const distDir = readArg("--dist", "dist");
  const outDir = readArg("--out", ".runs/parity");
  const threshold = Number(readArg("--threshold", "0.02"));

  for (const file of [spaPath, staticPath]) {
    if (!file || !existsSync(file)) {
      console.error(`FATAL: ${file || "(missing)"} does not exist`);
      process.exit(1);
    }
  }
  mkdirSync(outDir, { recursive: true });

  const snapshotDir = readArg("--snapshot", "scripts/cms-snapshots");
  const { server, port } = await startServer(
    path.resolve(distDir),
    {
      spa: path.resolve(spaPath),
      static: path.resolve(staticPath),
    },
    existsSync(snapshotDir) ? path.resolve(snapshotDir) : null,
  );

  const { chromium } = await import("playwright");
  const browser = await chromium.launch({
    executablePath: resolveChromium(chromium),
    args: [
      // The comparison host has to resolve to the loopback address without
      // touching DNS or /etc/hosts.
      `--host-resolver-rules=MAP ${PARITY_HOST} 127.0.0.1`,
      // A proxy on this machine points at a port nothing is listening on,
      // and Chromium honours it for 127.0.0.1 as well - which fails every
      // request with ERR_PROXY_CONNECTION_FAILED. "direct://" turns it off.
      "--proxy-server=direct://",
    ],
  });
  const viewports = [
    { name: "desktop", viewport: { width: 1350, height: 940 } },
    { name: "mobile", viewport: { width: 390, height: 844 } },
  ];

  let worst = 0;
  const failures = [];
  try {
    for (const { name, viewport } of viewports) {
      const base = `http://${PARITY_HOST}:${port}/?variant=`;
      const spa = await capture(browser, `${base}spa`, viewport, outDir, `spa-${name}`);
      const stat = await capture(browser, `${base}static`, viewport, outDir, `static-${name}`);

      const spaPng = decodePng(spa.buffer);
      const statPng = decodePng(stat.buffer);
      const diff = diffRatio(spaPng, statPng);
      worst = Math.max(worst, diff.ratio);

      console.log(`  ${name}: ${(diff.ratio * 100).toFixed(3)}% of the pixels differ (${diff.differing} of ${diff.total})`);
      if (diff.heightDelta) {
        console.log(`    height delta: ${diff.heightDelta > 0 ? "+" : ""}${diff.heightDelta}px (static vs spa)`);
      }
      console.log(`    heights: spa ${spa.info.height}px, static ${stat.info.height}px (settled ${spa.settledHeight} / ${stat.settledHeight})`);
      console.log(`    images: spa ${spa.info.images}, static ${stat.info.images}`);
      console.log(`    images loaded: spa ${spa.info.imagesLoaded}, static ${stat.info.imagesLoaded}`);
      console.log(`    hero slides: spa ${spa.heroSlides}, static ${stat.heroSlides}`);
      console.log(`    spa    h1: ${spa.info.h1}`);
      console.log(`    static h1: ${stat.info.h1}`);
      if (spa.info.h1 !== stat.info.h1) {
        failures.push(`${name}: the h1 is not the same text`);
      }
      // The document ships one hero frame; the SPA rotates through them.
      // The frame the document ships has to be the frame the SPA shows
      // first, or the reader is looking at a different photograph.
      if (stat.info.heroSlides !== 1) {
        failures.push(
          `${name}: the document ships ${stat.info.heroSlides} hero frames - it is a document, so it ships one`,
        );
      }
      if (spa.info.heroFirst && stat.info.heroFirst && spa.info.heroFirst !== stat.info.heroFirst) {
        failures.push(`${name}: the document's hero is not the SPA's first frame`);
      }
      // If the two halves do not hold the same number of images, they are
      // not showing the same content - and the pixel diff below would be
      // measuring that difference instead of the delivery mechanism.
      if (spa.info.images !== stat.info.images) {
        failures.push(
          `${name}: the two halves do not render the same content - ${spa.info.images} images in the SPA, ${stat.info.images} in the document`,
        );
      }
      // The pictures are lazy, so the harness makes them eager before the
      // screenshot. If one half still shows fewer loaded pictures than the
      // other, the diff below is measuring a missing photograph rather than
      // the delivery mechanism.
      if (spa.info.imagesLoaded !== stat.info.imagesLoaded) {
        failures.push(
          `${name}: the two halves do not show the same photographs - ${spa.info.imagesLoaded} loaded in the SPA, ${stat.info.imagesLoaded} in the document`,
        );
      }
      // A height difference of more than a few pixels means a section is
      // present in one half and missing from the other. 2px of slack for
      // sub-pixel rounding.
      if (Math.abs(diff.heightDelta || 0) > 2) {
        failures.push(
          `${name}: the page height differs by ${diff.heightDelta}px - a section is missing from one of the two halves`,
        );
      }
      if (diff.ratio > threshold) {
        failures.push(
          `${name}: ${(diff.ratio * 100).toFixed(2)}% of the pixels differ, over the ${(threshold * 100).toFixed(2)}% budget`,
        );
      }
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log(`  worst ratio: ${(worst * 100).toFixed(3)}%`);
  if (failures.length) {
    console.error(`\nPARITY FAILED (${failures.length}):`);
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }
  console.log("PARITY PASSED");
}

/* ----------------------------------------------------------- self-test */

/**
 * The stub has to answer the endpoints the SPA calls, or the comparison
 * measures a degraded page.
 *
 * This is a real server round trip, not a mock: the assertion is about the
 * HTTP answer the browser would get. The reverse assertion is explicit - the
 * stub that did NOT answer /api/cms/products returned 404 for it, and that is
 * exactly what this test has to be able to fail on.
 */
async function stubSelfTest(failures) {
  const dir = mkdtempSync(path.join(os.tmpdir(), "bbt-parity-stub-"));
  try {
    writeFileSync(
      path.join(dir, "products.json"),
      JSON.stringify([
        { id: "a", name: "A", categoryId: "stroller", status: "published" },
        { id: "b", name: "B", categoryId: "balance_bike", status: "published" },
        { id: "c", name: "C", categoryId: "stroller", status: "draft" },
      ]),
    );
    writeFileSync(path.join(dir, "settings.json"), JSON.stringify({ siteName: "BBT" }));
    writeFileSync(path.join(dir, "evaluations.json"), JSON.stringify([{ id: "e1" }]));
    writeFileSync(path.join(dir, "guides.json"), JSON.stringify([{ id: "g1" }]));
    writeFileSync(path.join(dir, "news.json"), JSON.stringify([{ id: "n1" }]));

    const { server, port } = await startServer(path.resolve("dist"), {}, dir);
    const get = async (route) => {
      const response = await fetch(`http://127.0.0.1:${port}${route}`);
      const text = await response.text();
      let body = null;
      try {
        body = JSON.parse(text);
      } catch {
        body = null;
      }
      return { status: response.status, body };
    };

    // The endpoint the SPA's PRIMARY product source uses. The old stub
    // answered 404 here, and the SPA then fell back to a single category -
    // which is how this harness first reported a 39.6% difference between two
    // copies of the same page.
    const cmsProducts = await get("/api/cms/products?onlyPublished=1");
    if (cmsProducts.status !== 200) {
      failures.push(
        `the stub does not answer /api/cms/products (status ${cmsProducts.status}) - the SPA would fall back to one category and the comparison would measure a degraded page`,
      );
    } else if (!Array.isArray(cmsProducts.body?.data) || cmsProducts.body.data.length !== 2) {
      failures.push(
        `the stub returned ${JSON.stringify(cmsProducts.body?.data)?.length ?? "no"} published products, expected 2`,
      );
    }

    const settings = await get("/api/cms/settings");
    if (settings.status !== 200 || settings.body?.siteName !== "BBT") {
      failures.push("the stub does not answer /api/cms/settings");
    }

    const categories = await get("/api/v2/categories");
    if (categories.status !== 200 || !Array.isArray(categories.body?.data)) {
      failures.push("the stub does not answer /api/v2/categories");
    } else if (categories.body.data.length !== 2) {
      failures.push(`the stub returned ${categories.body.data.length} categories, expected 2`);
    }

    const byCategory = await get("/api/v2/products?categoryId=stroller");
    if (byCategory.status !== 200 || byCategory.body?.data?.length !== 1) {
      failures.push("the stub does not answer /api/v2/products with a category filter");
    }

    for (const route of ["/api/cms/evaluations", "/api/cms/guides", "/api/cms/news"]) {
      const answer = await get(route);
      if (answer.status !== 200) failures.push(`the stub does not answer ${route}`);
    }

    server.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function selfTest() {
  const failures = [];

  // A 2x2 PNG, written by hand: four pixels, red / green / blue / white.
  function makePng(pixels, width, height) {
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 6; // colour type RGBA
    const raw = Buffer.alloc((width * 4 + 1) * height);
    for (let y = 0; y < height; y += 1) {
      raw[y * (width * 4 + 1)] = 0; // filter: none
      pixels.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
    }
    const chunks = [];
    const chunk = (type, data) => {
      const length = Buffer.alloc(4);
      length.writeUInt32BE(data.length, 0);
      const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
      const crc = Buffer.alloc(4);
      crc.writeUInt32BE(crc32(body) >>> 0, 0);
      return Buffer.concat([length, body, crc]);
    };
    chunks.push(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    chunks.push(chunk("IHDR", ihdr));
    chunks.push(chunk("IDAT", zlib.deflateSync(raw)));
    chunks.push(chunk("IEND", Buffer.alloc(0)));
    return Buffer.concat(chunks);
  }

  const CRC_TABLE = (() => {
    const table = new Int32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
    return table;
  })();
  function crc32(buffer) {
    let c = 0xffffffff;
    for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
    return c ^ 0xffffffff;
  }

  const pixels = Buffer.from([
    255, 0, 0, 255, 0, 255, 0, 255,
    0, 0, 255, 255, 255, 255, 255, 255,
  ]);
  const png = makePng(pixels, 2, 2);
  const decoded = decodePng(png);

  if (decoded.width !== 2 || decoded.height !== 2) failures.push("the decoder read the wrong size");
  if (decoded.data[0] !== 255 || decoded.data[1] !== 0 || decoded.data[2] !== 0) {
    failures.push("the decoder read the wrong first pixel");
  }
  if (decoded.data[4] !== 0 || decoded.data[5] !== 255 || decoded.data[6] !== 0) {
    failures.push("the decoder read the wrong second pixel");
  }

  const same = diffRatio(decoded, decodePng(png));
  if (same.ratio !== 0) failures.push("an identical image was reported as different");

  // One channel off by more than the tolerance.
  const changed = Buffer.from(pixels);
  changed[0] = 200;
  const onePixel = diffRatio(decoded, decodePng(makePng(changed, 2, 2)));
  if (onePixel.ratio !== 0.25) {
    failures.push(`one changed pixel was reported as ${onePixel.ratio}, expected 0.25`);
  }

  // One channel off by less than the tolerance: the same image.
  const near = Buffer.from(pixels);
  near[0] = 250;
  const noise = diffRatio(decoded, decodePng(makePng(near, 2, 2)));
  if (noise.ratio !== 0) failures.push("a sub-tolerance difference was reported as a difference");

  // Different widths: a full difference, not a crash.
  const other = diffRatio(decoded, decodePng(makePng(pixels, 1, 1)));
  if (other.ratio !== 1) failures.push("a width mismatch was not reported as a full difference");

  // Different heights: the shared region is compared and the delta is
  // reported, rather than the whole thing being called a total difference.
  const tall = decodePng(makePng(Buffer.concat([pixels, pixels]), 2, 4));
  const cropped = diffRatio(decoded, tall);
  if (cropped.ratio !== 0) failures.push("the shared region of two different heights was not compared");
  if (cropped.heightDelta !== 2) failures.push(`the height delta was ${cropped.heightDelta}, expected 2`);

  await stubSelfTest(failures);

  if (failures.length) {
    console.error(`SELF-TEST FAILED (${failures.length}):`);
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }
  console.log("SELF-TEST PASSED (6 cases + 6 stub cases)");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes("--self-test")) {
    selfTest().catch((error) => {
      console.error(error);
      process.exit(1);
    });
  } else {
    runCheck().catch((error) => {
      console.error(error);
      process.exit(1);
    });
  }
}
