// Static preview server for dist/ that mimics Cloudflare Pages _redirects
// semantics closely enough for local verification:
//   /x        -> serve /x.html if present, else /x/index.html, else SPA shell
//   /x/       -> same as /x
//   /         -> dist/index.html
// Usage: node scripts/preview-dist.mjs [port]
import http from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";

const distDir = path.resolve("dist");
const port = Number(process.argv[2] || 4181);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".woff2": "font/woff2",
};

async function statFile(p) {
  try {
    const st = await fs.stat(p);
    return st.isFile() ? p : null;
  } catch {
    return null;
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    let pathname = decodeURIComponent(url.pathname);

    // Mirrors "/api/* https://store.balancebiketoddler.com/api/:splat 307"
    if (pathname.startsWith("/api/")) {
      const upstream = await fetch(`https://store.balancebiketoddler.com${pathname}${url.search}`, {
        headers: { accept: req.headers.accept || "*/*" },
      });
      res.writeHead(upstream.status, { "content-type": upstream.headers.get("content-type") || "application/json" });
      res.end(Buffer.from(await upstream.arrayBuffer()));
      return;
    }

    if (pathname === "/") pathname = "/index.html";

    // 1) verbatim .html rewrite target (mirrors "/x /x.html 200!")
    const exact = await statFile(path.join(distDir, pathname));
    if (exact) {
      const buf = await fs.readFile(exact);
      res.writeHead(200, { "content-type": MIME[path.extname(exact)] || "application/octet-stream" });
      res.end(buf);
      return;
    }
    // 2) pretty URL: /x -> /x.html
    const htmlCandidate = await statFile(path.join(distDir, `${pathname}.html`));
    if (htmlCandidate) {
      const buf = await fs.readFile(htmlCandidate);
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(buf);
      return;
    }
    // 3) directory index
    const dirIndex = await statFile(path.join(distDir, pathname, "index.html"));
    if (dirIndex) {
      const buf = await fs.readFile(dirIndex);
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(buf);
      return;
    }
    // 4) SPA catch-all ("/* /index.html 200")
    const buf = await fs.readFile(path.join(distDir, "index.html"));
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(buf);
  } catch (err) {
    res.writeHead(500);
    res.end(String(err));
  }
});

server.listen(port, "127.0.0.1", () => console.log(`preview-dist listening on http://127.0.0.1:${port}`));
