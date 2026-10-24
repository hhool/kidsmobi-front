"""
publish-article-covers.py — build every article cover on a 1:1 canvas.

Why 1:1 and not 16:9:
  The guide covers are Amazon-style product shots (roughly 1500x1500 with a
  white background). The previous pass centre-cropped them to 800x450, which
  cut the handlebars and the wheels off every bike - that is the "wrong ratio"
  users kept seeing.

The rule this script exists to enforce: NOTHING IS EVER CROPPED.
  Two passes broke that rule in two different ways, and both were invisible
  to a CSS-level fix:

    1. the 16:9 pass centre-cropped every source to 16:9;
    2. the first 1:1 pass kept the canvas square but centre-cropped the
       source to a square before scaling it down. 45 of the 56 guide sources
       are NOT square (1500x1086, 1500x1219, 914x1500, 300x200, ...), so that
       pass silently deleted up to 39% of the picture - handlebars, wheels
       and all - from the file itself. `object-contain` in the page cannot
       bring back pixels that are no longer in the file.

  So the source is now scaled so its LONG side fills the canvas and the
  leftover space on the short axis is filled with a reflection of the
  image's own edge. Every pixel of the original survives, the aspect ratio
  is preserved, and the boundary carries no colour step, so the cover does
  not read as a picture that had something cut off.

  The news covers (800x450 editorial photos) use the same composer: the photo
  keeps its full width, and the space above/below is the photo's own edge,
  reflected and softened.

Outputs:
  guides -> public/images/guides/<slug>-800x800.webp   (from the ORIGINAL
            product photo; URLs come from article-cover-sources.json,
            recovered from the CMS snapshot before the covers were cropped)
  news   -> public/images/news/<slug>-800x800.webp

Usage:
  python publish-article-covers.py            # build files only
  python publish-article-covers.py --write    # also repoint imageUrl in the CMS
  python publish-article-covers.py --news-only   # rebuild news covers only

Verify:
  python scripts/verify-no-crop.py            # pixel-level proof, no crop
"""

import io
import json
import os
import sys
import urllib.request

from PIL import Image, ImageFilter

API_BASE = "https://store.balancebiketoddler.com"
GUIDE_OUT = os.path.join("public", "images", "guides")
NEWS_OUT = os.path.join("public", "images", "news")
SOURCE_MAP = os.path.join("scripts", "article-cover-sources.json")
GEOMETRY_MANIFEST = os.path.join("scripts", "article-cover-geometry.json")
TARGET = 800  # 1:1 canvas
# How fast the edge band dissolves into its blur, as a fraction of the band.
# Small values keep the reflection crisp (it reads as a reflection); large
# values dissolve it quickly (it reads as an out-of-focus continuation).
BLUR_REACH = 0.45


def http_get(url, token=None, timeout=60, attempts=3):
    last = None
    for attempt in range(attempts):
        try:
            req = urllib.request.Request(url)
            if token:
                req.add_header("x-cms-admin-token", token)
            # Cloudflare WAF error 1010 blocks the default urllib signature.
            req.add_header("user-agent", "kidsmobi-covers/1.1")
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.read()
        except Exception as exc:  # noqa: BLE001
            last = exc
            print(f"    retry {attempt + 1}/{attempts} for {url[-44:]}: {exc}")
    raise last


def compose_square(img):
    """Fit the WHOLE source image into a square canvas. Never crops.

    The source is scaled so its LONG side exactly fills the canvas, so every
    pixel of the original survives - nothing is cut off, and the aspect ratio
    is preserved (no squashing either). The leftover space on the short axis
    is filled with a reflection of the image's own edge:

        the band starts as a pixel-exact mirror of the picture's outermost
        row/column, so the boundary carries no colour step and no hard line,
        and then dissolves into a blur. A hard line is what made the picture
        read as sliced off; a blurred bed built from a *differently framed*
        copy of the frame had exactly that problem.

    Returns (canvas, meta) where meta records where the untouched source sits.
    """
    w, h = img.size
    scale = TARGET / float(max(w, h))
    inner_w = max(1, int(round(w * scale)))
    inner_h = max(1, int(round(h * scale)))
    inner = img.resize((inner_w, inner_h), Image.LANCZOS)

    x0 = (TARGET - inner_w) // 2
    y0 = (TARGET - inner_h) // 2

    canvas = Image.new("RGB", (TARGET, TARGET), (255, 255, 255))

    # ---- top band: mirror of the picture's top rows ----
    # The strip's BOTTOM row is the picture's top row, so the band meets the
    # picture without a seam and then dissolves into the blur further out.
    band_h = y0
    if band_h > 0:
        strip = inner.crop((0, 0, inner_w, min(band_h, inner_h))).transpose(Image.FLIP_TOP_BOTTOM)
        if strip.height != band_h:
            strip = strip.resize((inner_w, band_h), Image.LANCZOS)
        canvas.paste(_fade_to_blur(strip, "bottom"), (x0, 0))

    # ---- bottom band: mirror of the picture's bottom rows ----
    band_h = TARGET - (y0 + inner_h)
    if band_h > 0:
        strip = inner.crop((0, inner_h - min(band_h, inner_h), inner_w, inner_h)).transpose(
            Image.FLIP_TOP_BOTTOM
        )
        if strip.height != band_h:
            strip = strip.resize((inner_w, band_h), Image.LANCZOS)
        canvas.paste(_fade_to_blur(strip, "top"), (x0, y0 + inner_h))

    # ---- left / right bands (only reachable for portrait sources) ----
    band_w = x0
    if band_w > 0:
        strip = inner.crop((0, 0, min(band_w, inner_w), inner_h)).transpose(Image.FLIP_LEFT_RIGHT)
        if strip.width != band_w:
            strip = strip.resize((band_w, inner_h), Image.LANCZOS)
        canvas.paste(_fade_to_blur(strip, "right"), (0, y0))

    band_w = TARGET - (x0 + inner_w)
    if band_w > 0:
        strip = inner.crop((inner_w - min(band_w, inner_w), 0, inner_w, inner_h)).transpose(
            Image.FLIP_LEFT_RIGHT
        )
        if strip.width != band_w:
            strip = strip.resize((band_w, inner_h), Image.LANCZOS)
        canvas.paste(_fade_to_blur(strip, "left"), (x0 + inner_w, y0))

    # The untouched source on top.
    canvas.paste(inner, (x0, y0))
    return canvas, {
        "source": [w, h],
        "inner": [inner_w, inner_h],
        "offset": [x0, y0],
        "scale": round(scale, 6),
    }


def _fade_to_blur(strip, edge):
    """Blend a mirror strip into a blur, starting sharp at the picture edge.

    `edge` names the side of the strip that touches the picture ("top",
    "bottom", "left" or "right"). That side is left untouched, so the
    boundary is pixel-exact; the far side is fully blurred. The blur takes
    over quickly (BLUR_REACH of the band) so the band reads as an
    out-of-focus continuation rather than as a second copy of the frame.
    """
    blurred = strip.filter(ImageFilter.GaussianBlur(radius=16))
    return Image.composite(blurred, strip, _ramp(strip.size, edge))


def _ramp(size, edge):
    """Grayscale mask: 0 at the named edge, rising to 255 over BLUR_REACH.

    "edge" is the side of the strip that touches the picture, so that side
    stays sharp and the far end of the band dissolves into the blur.
    """
    w, h = size
    if edge in ("top", "bottom"):
        last = max(1, h - 1)
        reach = max(1.0, last * BLUR_REACH)
        if edge == "bottom":
            values = [int(round(255.0 * min(1.0, (last - y) / reach))) for y in range(h)]
        else:
            values = [int(round(255.0 * min(1.0, y / reach))) for y in range(h)]
        data = []
        for y in range(h):
            data.extend([values[y]] * w)
    else:
        last = max(1, w - 1)
        reach = max(1.0, last * BLUR_REACH)
        if edge == "right":
            values = [int(round(255.0 * min(1.0, (last - x) / reach))) for x in range(w)]
        else:
            values = [int(round(255.0 * min(1.0, x / reach))) for x in range(w)]
        data = []
        for _y in range(h):
            data.extend(values)

    mask = Image.new("L", (w, h))
    mask.putdata(data)
    return mask


def build_product_cover(raw, slug):
    """Product photo -> 800x800 with the whole picture visible."""
    with Image.open(io.BytesIO(raw)) as img:
        img = img.convert("RGB")
        path = os.path.join(GUIDE_OUT, f"{slug}-800x800.webp")
        canvas, meta = compose_square(img)
        canvas.save(path, "WEBP", quality=82, method=6)
    meta["out"] = os.path.relpath(path, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    return path, meta


def build_editorial_cover(raw, slug):
    """800x450 editorial photo -> an 800x800 canvas that keeps the whole photo.

    Same composer as the product covers: the picture is scaled to the full
    canvas width and centred, and the space above/below is filled with a
    reflection of the photo's own edge, so the canvas is 1:1, nothing is
    cropped, and there is no hard seam where the sharp photo meets the fill.
    """
    with Image.open(io.BytesIO(raw)) as img:
        img = img.convert("RGB")
        path = os.path.join(NEWS_OUT, f"{slug}-800x800.webp")
        canvas, meta = compose_square(img)
        canvas.save(path, "WEBP", quality=82, method=6)
    meta["out"] = os.path.relpath(path, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    return path, meta


def write_geometry_manifest(entries):
    """Record the geometry of every cover so a guard can check it.

    The manifest is what the CI guard reads. It proves, without needing an
    image decoder, that each cover's picture region has the SAME aspect ratio
    as its source and that the source was scaled to fill the canvas - i.e.
    that nothing was cropped and nothing was squashed.
    """
    covers = {}
    if os.path.exists(GEOMETRY_MANIFEST):
        try:
            with open(GEOMETRY_MANIFEST, encoding="utf-8") as fh:
                covers = json.load(fh).get("covers", {})
        except (ValueError, OSError):
            covers = {}
    # Merge, so rebuilding only the news covers does not erase the guide
    # geometry (and vice versa).
    covers.update(entries)
    payload = {
        "canvas": TARGET,
        "covers": {slug: meta for slug, meta in sorted(covers.items())},
    }
    with open(GEOMETRY_MANIFEST, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2, sort_keys=True)
        fh.write("\n")
    return GEOMETRY_MANIFEST


def rebuild_news_only():
    """Rebuild just the news covers from SOURCE_MAP (no CMS, no token).

    Used when only the compositing changed and the CMS already points at the
    <slug>-800x800.webp filenames, so there is nothing to repoint.
    """
    os.makedirs(NEWS_OUT, exist_ok=True)
    with open(SOURCE_MAP, encoding="utf-8") as fh:
        news_sources = json.load(fh).get("news", {})
    built, failed = 0, []
    geometry = {}
    for slug, src in news_sources.items():
        src = str(src or "").strip()
        if not src:
            failed.append(f"{slug}: no source URL")
            continue
        if src.startswith("/"):
            src = "https://balancebiketoddler.com" + src
        try:
            data = http_get(src)
            path, meta = build_editorial_cover(data, slug)
            geometry[slug] = meta
            print(f"  {os.path.basename(path)}  {os.path.getsize(path) / 1024:.0f}KB  <- {src[-52:]}")
            built += 1
        except Exception as exc:  # noqa: BLE001
            failed.append(f"{slug}: {exc}")
    print(f"\nnews rebuilt: {built}/{len(news_sources)}")
    if failed:
        print("FAILED:")
        for f in failed:
            print("  -", f)
        return 1
    write_geometry_manifest(geometry)
    return 0


def rebuild_guides_only():
    """Rebuild just the guide covers from SOURCE_MAP (no CMS, no token)."""
    os.makedirs(GUIDE_OUT, exist_ok=True)
    with open(SOURCE_MAP, encoding="utf-8") as fh:
        guide_sources = json.load(fh)["guides"]
    built, failed = 0, []
    geometry = {}
    for slug, src in guide_sources.items():
        src = str(src or "").strip()
        if not src:
            failed.append(f"{slug}: no source URL")
            continue
        try:
            data = http_get(src)
            path, meta = build_product_cover(data, slug)
            geometry[slug] = meta
            print(f"  {os.path.basename(path)}  {os.path.getsize(path) / 1024:.0f}KB  <- {src[-52:]}")
            built += 1
        except Exception as exc:  # noqa: BLE001
            failed.append(f"{slug}: {exc}")
    print(f"\nguides rebuilt: {built}/{len(guide_sources)}")
    if failed:
        print("FAILED:")
        for f in failed:
            print("  -", f)
        return 1
    write_geometry_manifest(geometry)
    return 0


def main():
    if "--news-only" in sys.argv:
        return rebuild_news_only()
    if "--guides-only" in sys.argv:
        return rebuild_guides_only()

    token = os.environ.get("CMS_ADMIN_ALL_TOKEN", "")
    write = "--write" in sys.argv
    if not token:
        print("CMS_ADMIN_ALL_TOKEN is required")
        return 1

    os.makedirs(GUIDE_OUT, exist_ok=True)
    os.makedirs(NEWS_OUT, exist_ok=True)

    with open(SOURCE_MAP, encoding="utf-8") as fh:
        source_map = json.load(fh)
    guide_sources = source_map["guides"]
    news_sources = source_map.get("news", {})

    raw = http_get(f"{API_BASE}/api/cms/ops/export", token=token)
    collections = json.loads(raw)["data"]["collections"]
    published = [g for g in collections["guides"] if str(g.get("status", "")).lower() == "published"]
    news = [n for n in collections["news"] if str(n.get("status", "")).lower() == "published"]
    print(f"published guides: {len(published)} | published news: {len(news)}")

    built, failed = 0, []
    geometry = {}

    # ---- guides: rebuild from the ORIGINAL square product photo ----
    for g in published:
        slug = str(g.get("slug") or "").strip()
        src = guide_sources.get(slug)
        if not slug or not src:
            failed.append(f"{slug or g.get('id')}: no original source URL")
            continue
        try:
            data = http_get(src)
            path, meta = build_product_cover(data, slug)
            geometry[slug] = meta
            print(f"  {os.path.basename(path)}  {os.path.getsize(path)/1024:.0f}KB  <- {src[-52:]}")
            built += 1
        except Exception as exc:  # noqa: BLE001
            failed.append(f"{slug}: {exc}")

    # ---- news: square canvas with the full editorial photo on a blurred bed ----
    for n in news:
        slug = str(n.get("slug") or "").strip()
        # The source map holds the ORIGINAL 800x450 artwork. The CMS value has
        # already been repointed at the generated square cover, so reading it
        # back would feed the script its own output.
        src = str(news_sources.get(slug) or n.get("imageUrl") or "").strip()
        if not slug or not src:
            failed.append(f"{slug or n.get('id')}: no slug/image")
            continue
        if src.startswith("/"):
            src = "https://balancebiketoddler.com" + src
        try:
            data = http_get(src)
            path, meta = build_editorial_cover(data, slug)
            geometry[slug] = meta
            print(f"  {os.path.basename(path)}  {os.path.getsize(path)/1024:.0f}KB  <- {src[-52:]}")
            built += 1
        except Exception as exc:  # noqa: BLE001
            failed.append(f"{slug}: {exc}")

    print(f"\nbuilt: {built}/{len(published) + len(news)}")
    if failed:
        print("FAILED:")
        for f in failed:
            print("  -", f)
        return 1
    write_geometry_manifest(geometry)

    if not write:
        print("\nDry run. Re-run with --write to repoint imageUrl in the CMS.")
        return 0

    # ---- repoint the CMS at the new square covers ----
    updated = 0
    for collection, records in (("guides", published), ("news", news)):
        for rec in records:
            slug = str(rec.get("slug") or "").strip()
            folder = "guides" if collection == "guides" else "news"
            new_path = f"/images/{folder}/{slug}-800x800.webp"
            if str(rec.get("imageUrl") or "").strip() == new_path:
                continue
            payload = dict(rec)
            payload["imageUrl"] = new_path
            req = urllib.request.Request(
                f"{API_BASE}/api/cms/{collection}/save",
                data=json.dumps(payload).encode("utf-8"),
                method="POST",
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "x-cms-admin-token": token,
                    "User-Agent": "kidsmobi-covers/1.1",
                },
            )
            try:
                with urllib.request.urlopen(req, timeout=60) as resp:
                    if resp.status == 200:
                        updated += 1
                    else:
                        failed.append(f"{collection}/{slug}: HTTP {resp.status}")
            except Exception as exc:  # noqa: BLE001
                failed.append(f"{collection}/{slug}: {exc}")
    print(f"imageUrl updated: {updated}")
    if failed:
        print("FAILED:")
        for f in failed:
            print("  -", f)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
