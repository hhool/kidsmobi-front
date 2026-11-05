// Static preview server for dist/ that mimics Cloudflare Pages closely enough
// for local verification:
//   /x        -> serve /x.html if present, else /x/index.html, else SPA shell
//   /x/       -> same as /x
//   /         -> dist/index.html
//   /api/*    -> 307 to https://store.balancebiketoddler.com/api/:splat
//
// Usage: node scripts/preview-dist.mjs [port]
//
// Two things here exist so that a local Lighthouse run measures the same
// object the live site does. Both were wrong before, and both inflated the
// local numbers so badly that the local report could not be compared with
// production at all:
//
//   1. Compression. Cloudflare compresses every text response; this server
//      used to serve the raw bytes. The entry JS transferred 1,217,247 bytes
//      locally against 319,270 in production - a 3.8x difference that lands
//      straight on LCP and TBT. Brotli quality 4 reproduces the production
//      transfer size to within 2% (measured 2026-11-05: local q4 313,787 vs
//      production br 319,270 on a comparable bundle), and it is fast enough
//      to compress on the fly.
//
//   2. The API proxy. The store answers with brotli, and the proxy used to
//      forward only the content type - so a 281 KB payload arrived as
//      3,181,816 bytes. The proxy now passes the raw bytes through with
//      their content-encoding intact, exactly like the 307 in _redirects.
//
// Together with a hostname that resolves to 127.0.0.1 but is not "localhost"
// (localtest.me), the SPA also takes the production code path: same-origin
// /api/v2/* instead of the local /api/content/bundle aggregator.
import http from "node:http";
import https from "node:https";
import zlib from "node:zlib";
import { promises as fs } from "node:fs";
import path from "node:path";

const distDir = path.resolve("dist");
const port = Number(process.argv[2] || 4181);
const STORE_ORIGIN = "https://store.balancebiketoddler.com";

// Cloudflare Pages has no 404 rewrite, so unknown paths are simply left
// unmatched and fall through to the top-level 404.html.
const SPA_PREFIXES = [
  "/products/",
  "/reviews/",
  "/guides/",
  "/news/",
  "/transparency/",
  "/about/",
  "/compare/",
  "/auth/",
  "/search/",
];

// Bare app roots rewritten to the shell by static rules in _redirects.
const SPA_EXACT_PATHS = ["/compare", "/auth", "/search", "/transparency"];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".woff2": "font/woff2",
};

// Only these are worth compressing. Images are already compressed formats,
// and Cloudflare does not re-encode them.
const COMPRESSIBLE = new Set([".html", ".js", ".css", ".json", ".svg", ".txt", ".xml", ".webmanifest"]);

const BROTLI_QUALITY = 4;

const brotliCompress = (buf) =>
  new Promise((resolve, reject) => {
    zlib.brotliCompress(buf, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: BROTLI_QUALITY } }, (err, out) =>
      err ? reject(err) : resolve(out),
    );
  });

const gzipCompress = (buf) =>
  new Promise((resolve, reject) => {
    zlib.gzip(buf, { level: 6 }, (err, out) => (err ? reject(err) : resolve(out)));
  });

/**
 * Compressed variants, cached per file. The cache keeps a Lighthouse run from
 * paying the compression cost inside the measured request.
 */
const compressCache = new Map();

async function compressedVariants(file, stat) {
  const cached = compressCache.get(file);
  if (cached && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size) return cached;
  const raw = await fs.readFile(file);
  const [br, gzip] = await Promise.all([brotliCompress(raw), gzipCompress(raw)]);
  const entry = { mtimeMs: stat.mtimeMs, size: stat.size, br, gzip };
  compressCache.set(file, entry);
  return entry;
}

function negotiateEncoding(req) {
  const accept = String(req.headers["accept-encoding"] || "").toLowerCase();
  if (/(^|[\s,])br([\s,;]|$)/.test(accept)) return "br";
  if (/(^|[\s,])gzip([\s,;]|$)/.test(accept)) return "gzip";
  return null;
}

/**
 * Send one file, compressed the way the edge sends it.
 */
async function sendFile(req, res, file, contentType, cacheControl) {
  const ext = path.extname(file).toLowerCase();
  const stat = await fs.stat(file);
  const encoding = COMPRESSIBLE.has(ext) ? negotiateEncoding(req) : null;
  const headers = {
    "content-type": contentType,
    "vary": "accept-encoding",
  };
  if (cacheControl) headers["cache-control"] = cacheControl;

  if (!encoding) {
    const buf = await fs.readFile(file);
    headers["content-length"] = String(buf.length);
    res.writeHead(200, headers);
    res.end(buf);
    return;
  }

  const variants = await compressedVariants(file, stat);
  const body = variants[encoding];
  headers["content-encoding"] = encoding;
  headers["content-length"] = String(body.length);
  res.writeHead(200, headers);
  res.end(body);
}

/**
 * Raw upstream GET. node:https does not decompress, so the bytes and the
 * content-encoding header stay exactly as the store sent them - which is
 * what a 307 to the store would deliver in production.
 */
function rawGet(target, headers) {
  return new Promise((resolve, reject) => {
    const req = https.request(target, { method: "GET", headers }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve({ status: res.statusCode || 502, headers: res.headers, body: Buffer.concat(chunks) }));
      res.on("error", reject);
    });
    req.on("error", reject);
    req.end();
  });
}

async function statFile(p) {
  try {
    const st = await fs.stat(p);
    return st.isFile() ? p : null;
  } catch {
    return null;
  }
}

const ASSET_CACHE_CONTROL = "public, max-age=14400, must-revalidate";
const HTML_CACHE_CONTROL = "public, max-age=0, must-revalidate";

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    let pathname = decodeURIComponent(url.pathname);

    // Mirrors "/api/* https://store.balancebiketoddler.com/api/:splat 307"
    if (pathname.startsWith("/api/")) {
      const upstream = await rawGet(`${STORE_ORIGIN}${pathname}${url.search}`, {
        accept: req.headers.accept || "*/*",
        "accept-encoding": req.headers["accept-encoding"] || "gzip, br",
        "accept-language": req.headers["accept-language"] || "",
        "user-agent": req.headers["user-agent"] || "",
      });
      const headers = {
        "content-type": upstream.headers["content-type"] || "application/json",
        vary: upstream.headers.vary || "accept-encoding",
      };
      const encoding = upstream.headers["content-encoding"];
      if (encoding) headers["content-encoding"] = encoding;
      headers["content-length"] = String(upstream.body.length);
      res.writeHead(upstream.status, headers);
      res.end(upstream.body);
      return;
    }

    if (pathname === "/") pathname = "/index.html";

    // 1) verbatim .html rewrite target (mirrors "/x /x.html 200!")
    const exact = await statFile(path.join(distDir, pathname));
    if (exact) {
      const ext = path.extname(exact).toLowerCase();
      const isAsset = pathname.startsWith("/assets/") || ext !== ".html";
      await sendFile(
        req,
        res,
        exact,
        MIME[ext] || "application/octet-stream",
        isAsset ? ASSET_CACHE_CONTROL : HTML_CACHE_CONTROL,
      );
      return;
    }
    // 2) pretty URL: /x -> /x.html
    const htmlCandidate = await statFile(path.join(distDir, `${pathname}.html`));
    if (htmlCandidate) {
      await sendFile(req, res, htmlCandidate, "text/html; charset=utf-8", HTML_CACHE_CONTROL);
      return;
    }
    // 3) directory index
    const dirIndex = await statFile(path.join(distDir, pathname, "index.html"));
    if (dirIndex) {
      await sendFile(req, res, dirIndex, "text/html; charset=utf-8", HTML_CACHE_CONTROL);
      return;
    }
    // 4) prefix-scoped SPA fallback (mirrors the per-prefix rules in
    //    public/_redirects). Anything outside those prefixes is served
    //    dist/404.html with a real 404 status, exactly like Pages does once a
    //    top-level 404.html exists.
    if (
      SPA_EXACT_PATHS.includes(pathname) ||
      SPA_PREFIXES.some((prefix) => pathname.startsWith(prefix))
    ) {
      await sendFile(req, res, path.join(distDir, "index.html"), "text/html; charset=utf-8", HTML_CACHE_CONTROL);
      return;
    }

    const notFound = await statFile(path.join(distDir, "404.html"));
    if (notFound) {
      await sendFile(req, res, notFound, "text/html; charset=utf-8", HTML_CACHE_CONTROL);
    } else {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("404 Not Found");
    }
  } catch (err) {
    res.writeHead(500);
    res.end(String(err));
  }
});

server.listen(port, "127.0.0.1", () =>
  console.log(`preview-dist listening on http://127.0.0.1:${port} (compressed, store proxy preserves content-encoding)`),
);
