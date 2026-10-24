"""
verify-no-crop.py - prove that no article cover crops its source image.

This is a guard, not a viewer. For every generated cover it re-derives the
expected canvas from the ORIGINAL source and compares it, pixel by pixel,
with the file that is actually on disk. If any part of the source were
cropped away, the comparison would fail.

The proof per artwork type:

  guides  the source is an Amazon-style product shot on white. The cover must
          be the WHOLE source, scaled so its long side fills the canvas, with
          the leftover space filled by a reflection of the source's own edge.
          Proof: the sharp region of the cover must be the source scaled
          (not a crop of it), and the reflected band next to the picture must
          be a mirror of the picture's edge.

  news    the source is an 800x450 editorial photo. Same rule: the whole
          photo must be present, at full canvas width, with the space
          above/below filled by the photo's own edge.

Two failure modes this catches, both of which shipped once:
  - a cover whose sharp region is a CENTRE CROP of the source (the first 1:1
    pass did this to 45 of the 56 guide covers, deleting up to 39% of the
    picture inside the file);
  - a hard seam at the picture/fill boundary, which reads as "sliced off"
    even when nothing was actually cropped.

Usage:
  python scripts/verify-no-crop.py
"""

import io
import json
import os
import sys
import urllib.request

from PIL import Image, ImageChops, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE_MAP = os.path.join(ROOT, "scripts", "article-cover-sources.json")
GUIDE_OUT = os.path.join(ROOT, "public", "images", "guides")
NEWS_OUT = os.path.join(ROOT, "public", "images", "news")
TARGET = 800
SITE = "https://balancebiketoddler.com"

# Tolerances. WebP is lossy, so comparisons allow a small absolute error.
MEAN_TOL = 6.0          # mean absolute difference over a region
PIXEL_TOL = 70          # single-pixel difference allowed
# A crop of a product photo cuts the wheels off; the reflection band, by
# contrast, is a blurred copy of the edge, so it is only required to be
# *consistent* with the edge, not pixel-identical to it.
SEAM_GRAD_FACTOR = 3.0


def http_get(url, timeout=60, attempts=3):
    last = None
    for attempt in range(attempts):
        try:
            req = urllib.request.Request(url)
            # Cloudflare WAF error 1010 blocks the default urllib signature.
            req.add_header("user-agent", "kidsmobi-covers/1.1")
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.read()
        except Exception as exc:  # noqa: BLE001
            last = exc
            print(f"    retry {attempt + 1}/{attempts}: {exc}")
    raise last


def load_source(src):
    """Return (RGB image, label) for a source entry of the cover source map."""
    if src.startswith("/"):
        path = os.path.join(ROOT, "public", src.lstrip("/"))
        if os.path.exists(path):
            with open(path, "rb") as fh:
                return Image.open(io.BytesIO(fh.read())).convert("RGB"), path
        url = SITE + src
    else:
        url = src
    return Image.open(io.BytesIO(http_get(url))).convert("RGB"), url


def mean_abs_diff(a, b):
    """Mean absolute difference between two same-size RGB images."""
    diff = ImageChops.difference(a, b)
    data = list(diff.convert("L").getdata())
    return sum(data) / float(len(data))


def max_abs_diff(a, b):
    diff = ImageChops.difference(a, b)
    return max(diff.convert("L").getdata())


def row_gradient(img, y):
    """Mean absolute difference between row y-1 and row y."""
    w, h = img.size
    a = img.crop((0, y, w, y + 1)).convert("L")
    b = img.crop((0, y - 1, w, y)).convert("L")
    data = list(ImageChops.difference(a, b).getdata())
    return sum(data) / float(len(data))


def col_gradient(img, x):
    """Mean absolute difference between column x-1 and column x."""
    w, h = img.size
    a = img.crop((x, 0, x + 1, h)).convert("L")
    b = img.crop((x - 1, 0, x, h)).convert("L")
    data = list(ImageChops.difference(a, b).getdata())
    return sum(data) / float(len(data))


def expected_geometry(src_size):
    """The geometry the composer must produce: the whole source, long side full.

    Returns (inner_w, inner_h, x0, y0).
    """
    w, h = src_size
    scale = TARGET / float(max(w, h))
    inner_w = max(1, int(round(w * scale)))
    inner_h = max(1, int(round(h * scale)))
    return inner_w, inner_h, (TARGET - inner_w) // 2, (TARGET - inner_h) // 2

def check_cover(slug, src, out_path):
    """Prove one cover keeps 100% of its source."""
    if not os.path.exists(out_path):
        return False, "cover file missing"
    with Image.open(out_path) as im:
        cover = im.convert("RGB")
    if cover.size != (TARGET, TARGET):
        return False, f"cover is {cover.size[0]}x{cover.size[1]}, expected 800x800"

    try:
        source, label = load_source(src)
    except Exception as exc:  # noqa: BLE001
        return False, f"source unreachable ({exc})"
    sw, sh = source.size
    inner_w, inner_h, x0, y0 = expected_geometry((sw, sh))

    # ---- 1. the sharp region must be the WHOLE source, scaled ----
    band = cover.crop((x0, y0, x0 + inner_w, y0 + inner_h))
    expected_band = source.resize((inner_w, inner_h), Image.LANCZOS)
    mean = mean_abs_diff(band, expected_band)
    if mean > MEAN_TOL:
        return False, (
            f"the picture does not match the source (mean diff {mean:.2f} > {MEAN_TOL}) - "
            f"it is cropped or altered"
        )
    worst = max_abs_diff(band, expected_band)
    if worst > PIXEL_TOL:
        return False, f"the picture has a large local deviation (max {worst}) - content lost"

    # ---- 2. the fill must be a mirror of the picture's own edge ----
    # The band above the picture is the picture's top rows reflected, so
    # comparing the band's bottom row with the picture's top row must give a
    # small difference: the seam is where a crop would look like a cut.
    if y0 > 0:
        band_bottom = cover.crop((x0, y0 - 1, x0 + inner_w, y0))
        pic_top = cover.crop((x0, y0, x0 + inner_w, y0 + 1))
        d = mean_abs_diff(band_bottom, pic_top)
        if d > MEAN_TOL * 2:
            return False, (
                f"the fill above the picture is not its own edge (mean diff {d:.2f}) - "
                f"the boundary would read as a cut"
            )
    if TARGET - (y0 + inner_h) > 0:
        band_top = cover.crop((x0, y0 + inner_h, x0 + inner_w, y0 + inner_h + 1))
        pic_bottom = cover.crop((x0, y0 + inner_h - 1, x0 + inner_w, y0 + inner_h))
        d = mean_abs_diff(band_top, pic_bottom)
        if d > MEAN_TOL * 2:
            return False, f"the fill below the picture is not its own edge (mean diff {d:.2f})"

    # ---- 3. no hard seam: the step across the boundary must not be an
    #         outlier compared with the steps inside the picture ----
    inside_rows = [row_gradient(band, y) for y in range(4, inner_h - 4, max(1, inner_h // 24))]
    inside_avg = sum(inside_rows) / len(inside_rows)
    if y0 > 0:
        seam = row_gradient(cover, y0)
        if seam > max(4.0, inside_avg * SEAM_GRAD_FACTOR):
            return False, (
                f"hard seam above the picture (step {seam:.1f} vs inside {inside_avg:.1f}) - "
                f"reads as a crop"
            )
    if TARGET - (y0 + inner_h) > 0:
        seam = row_gradient(cover, y0 + inner_h)
        if seam > max(4.0, inside_avg * SEAM_GRAD_FACTOR):
            return False, (
                f"hard seam below the picture (step {seam:.1f} vs inside {inside_avg:.1f}) - "
                f"reads as a crop"
            )

    inside_cols = [col_gradient(band, x) for x in range(4, inner_w - 4, max(1, inner_w // 24))]
    inside_avg_c = sum(inside_cols) / len(inside_cols)
    if x0 > 0:
        seam = col_gradient(cover, x0)
        if seam > max(4.0, inside_avg_c * SEAM_GRAD_FACTOR):
            return False, f"hard seam left of the picture (step {seam:.1f}) - reads as a crop"

    if TARGET - (x0 + inner_w) > 0:
        seam = col_gradient(cover, x0 + inner_w)
        if seam > max(4.0, inside_avg_c * SEAM_GRAD_FACTOR):
            return False, f"hard seam right of the picture (step {seam:.1f}) - reads as a crop"

    detail = (
        f"source {sw}x{sh} fully present as {inner_w}x{inner_h} at ({x0},{y0}), "
        f"seam continuous (mean diff {mean:.2f})"
    )
    return True, detail


def main():
    with open(SOURCE_MAP, encoding="utf-8") as fh:
        source_map = json.load(fh)

    failures = []
    guides_ok = news_ok = 0

    print("== guides: product photos, whole source kept ==")
    for slug, src in source_map["guides"].items():
        path = os.path.join(GUIDE_OUT, f"{slug}-800x800.webp")
        ok, msg = check_cover(slug, src, path)
        if ok:
            guides_ok += 1
        else:
            failures.append(f"guide/{slug}: {msg}")
            msg = f"FAIL - {msg}"
        print(f"  {'ok  ' if ok else 'FAIL'} {slug}: {msg}")

    print("\n== news: 800x450 editorial photos, whole photo kept ==")
    for slug, src in source_map.get("news", {}).items():
        path = os.path.join(NEWS_OUT, f"{slug}-800x800.webp")
        ok, msg = check_cover(slug, src, path)
        if ok:
            news_ok += 1
        else:
            failures.append(f"news/{slug}: {msg}")
            msg = f"FAIL - {msg}"
        print(f"  {'ok  ' if ok else 'FAIL'} {slug}: {msg}")

    total = len(source_map["guides"]) + len(source_map.get("news", {}))
    print(f"\nno-crop proof: {guides_ok + news_ok}/{total} covers keep 100% of their source")
    if failures:
        print("\nFAILURES:")
        for f in failures:
            print(f"  - {f}")
        return 1
    print("RESULT: PASS - no cover crops any part of its source image.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
