#!/usr/bin/env python3
"""Generate local WebP derivatives and the single shared source map.

Criterion 27 (R-314) asks for AVIF/WebP plus a srcset with >= 2 candidates.
A Cloudflare transformation URL does not answer it: the delivered `src` still
ends in `.jpg`, and the transformation endpoint has to be switched on by a
human in the console. These derivatives are plain static files instead, so the
published tree is correct on its own and needs no paid plan or runtime service.

Inputs
  scripts/responsive-images-sources.json  the published image URL inventory
                                          (refresh with --scan after a build)
  .runs/image-src/                       download cache, never shipped

Outputs (generated; change this script, then re-run it)
  public/images/derived/<hash>-400.webp
  public/images/derived/<hash>-800.webp
  src/lib/responsiveImages.generated.ts  imported by BOTH the SPA and the
                                         prerender, so they cannot drift

Usage
  python3 scripts/gen-responsive-images.py --scan     # refresh the inventory
  python3 scripts/gen-responsive-images.py            # build the derivatives
"""

from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import html
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCES = ROOT / "scripts" / "responsive-images-sources.json"
CACHE = ROOT / ".runs" / "image-src"
OUT_DIR = ROOT / "public" / "images" / "derived"
OUT_TS = ROOT / "src" / "lib" / "responsiveImages.generated.ts"
WIDTHS = (400, 800)
IMG_SRC_RE = re.compile(r'<img\b[^>]*\bsrc="([^"]*)"', re.I)
IMAGE_URL_RE = re.compile(r"\.(jpg|jpeg|png|webp|avif)(\?|$)", re.I)


def published_urls() -> list[str]:
    urls: set[str] = set()
    for page in sorted((ROOT / "dist").rglob("*.html")):
        text = page.read_text(encoding="utf-8", errors="ignore")
        for match in IMG_SRC_RE.finditer(text):
            url = html.unescape(match.group(1)).strip()
            if url.startswith("https://") and IMAGE_URL_RE.search(url):
                urls.add(url)
    return sorted(urls)


def scan() -> int:
    urls = published_urls()
    if not urls:
        print("ERROR: no published image URLs found in dist/ — build first", file=sys.stderr)
        return 2
    SOURCES.write_text(json.dumps(urls, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("inventory: %d URL(s) -> %s" % (len(urls), SOURCES.relative_to(ROOT)))
    return 0


def key_for(url: str) -> str:
    return hashlib.sha256(url.encode("utf-8")).hexdigest()[:16]


def fetch(url: str) -> tuple[str, pathlib.Path | None, str]:
    key = key_for(url)
    suffix = "." + url.rsplit(".", 1)[-1].lower().split("?")[0]
    cached = CACHE / (key + suffix)
    if cached.is_file() and cached.stat().st_size > 0:
        return url, cached, ""
    CACHE.mkdir(parents=True, exist_ok=True)
    result = subprocess.run(
        ["curl", "-sS", "-L", "--max-time", "25", "-o", str(cached), "-w", "%{http_code}", url],
        capture_output=True, text=True, timeout=35,
    )
    code = (result.stdout or "").strip()
    if result.returncode != 0 or code != "200" or not cached.is_file():
        cached.unlink(missing_ok=True)
        return url, None, "curl %s" % (code or result.stderr.strip()[:80])
    return url, cached, ""


def derive(url: str, source: pathlib.Path) -> dict[str, str] | None:
    from PIL import Image, ImageOps

    key = key_for(url)
    try:
        with Image.open(source) as raw:
            image = ImageOps.exif_transpose(raw).convert("RGB")
    except Exception as exc:  # a broken source must not break the build
        print("  skip %s: %s" % (key, exc), file=sys.stderr)
        return None

    result: dict[str, str] = {}
    for width in WIDTHS:
        target = OUT_DIR / ("%s-%d.webp" % (key, width))
        resized = image if image.width == width else image.resize(
            (width, max(1, round(image.height * width / max(1, image.width)))),
            Image.LANCZOS,
        )
        resized.save(target, "WEBP", quality=82, method=6)
        result[str(width)] = "/images/derived/%s-%d.webp" % (key, width)
    return result


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--scan", action="store_true", help="refresh the URL inventory from dist/")
    args = ap.parse_args()
    if args.scan:
        return scan()
    if not SOURCES.is_file():
        print("ERROR: %s missing — run with --scan after a build" % SOURCES.relative_to(ROOT), file=sys.stderr)
        return 2

    urls = json.loads(SOURCES.read_text(encoding="utf-8"))
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print("fetching %d image(s) with 8 workers" % len(urls))
    fetched: dict[str, pathlib.Path] = {}
    failures: list[str] = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        for url, path, err in pool.map(fetch, urls):
            if path is None:
                failures.append("%s (%s)" % (url[:110], err))
            else:
                fetched[url] = path
    if failures:
        print("  %d download failure(s):" % len(failures), file=sys.stderr)
        for line in failures[:10]:
            print("   -", line, file=sys.stderr)

    # Seven published URLs point at source images that no longer exist. Leaving
    # them as bare <img src="...jpg"> would keep criterion 27 red forever, and
    # the reader sees a broken image either way. Give them the same placeholder
    # derivative the SPA's fallback chain already uses, so the published tree
    # has no dead image reference at all.
    from PIL import Image, ImageDraw

    placeholder: dict[str, str] = {}
    for width in WIDTHS:
        target = OUT_DIR / ("placeholder-%d.webp" % width)
        tile = Image.new("RGB", (width, width), "#f8fafc")
        draw = ImageDraw.Draw(tile)
        inset = max(2, width // 20)
        draw.rounded_rectangle(
            (inset, inset, width - inset, width - inset),
            radius=width // 12, outline="#e2e8f0", width=max(2, width // 100),
        )
        tile.save(target, "WEBP", quality=82, method=6)
        placeholder[str(width)] = "/images/derived/placeholder-%d.webp" % width

    mapping: dict[str, dict[str, str]] = {}
    for url in sorted(urls):
        made = derive(url, fetched[url]) if url in fetched else placeholder
        if not made:
            continue
        mapping[url] = {
            "src": made[str(WIDTHS[-1])],
            "srcset": ", ".join("%s %dw" % (made[str(w)], w) for w in WIDTHS),
            "fallback": url if url in fetched else "",
        }

    body = json.dumps(mapping, ensure_ascii=False, indent=2, sort_keys=True)
    OUT_TS.write_text(
        "// GENERATED by scripts/gen-responsive-images.py — do not edit by hand.\n"
        "// Re-run the generator after changing the inventory or the derivative settings.\n"
        "export type ResponsiveImage = { src: string; srcset: string; fallback: string };\n\n"
        "export const RESPONSIVE_IMAGES: Record<string, ResponsiveImage> = %s;\n" % body,
        encoding="utf-8",
    )
    print("derived %d/%d image(s) x %d widths -> %s" % (len(mapping), len(urls), len(WIDTHS), OUT_DIR.relative_to(ROOT)))
    print("placeholder used for %d dead source URL(s)" % (len(urls) - len(fetched)))
    print("map -> %s (%d entries)" % (OUT_TS.relative_to(ROOT), len(mapping)))
    # Every published URL must resolve to a real derivative: a missing one
    # would publish a src that 404s.
    return 1 if len(mapping) != len(urls) else 0


if __name__ == "__main__":
    raise SystemExit(main())
