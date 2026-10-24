"""
publish-article-covers.py — build every article cover on a 1:1 canvas.

Why 1:1 and not 16:9:
  The guide covers are Amazon-style product shots (1500x1500 squares with a
  white background). The previous pass centre-cropped them to 800x450, which
  cut the handlebars and the wheels off every bike - that is the "wrong ratio"
  users kept seeing. A square canvas needs no crop at all for those: the
  source IS square, so we only downscale.

  The news covers are 800x450 editorial photos. Cropping them to a square
  would slice the subject out of frame (a rider on the left, a bike on the
  right). Instead they get the standard social treatment: the photo is scaled
  to fit the full 800px width and centred on a blurred, darkened copy of
  itself, so the canvas is 1:1 but nothing is cropped out of the picture.

Outputs:
  guides -> public/images/guides/<slug>-800x800.webp   (from the ORIGINAL
            square product photo; URLs come from article-cover-sources.json,
            recovered from the CMS snapshot before the covers were cropped)
  news   -> public/images/news/<slug>-800x800.webp

Usage:
  python publish-article-covers.py            # build files only
  python publish-article-covers.py --write    # also repoint imageUrl in the CMS
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
TARGET = 800  # 1:1 canvas


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


def save_square(img, path):
    """Pad or crop to exactly TARGET x TARGET, then save as WebP.

    Square sources (the product photos) are only downscaled, so nothing is
    cut. Non-square sources are centre-cropped on the long axis.
    """
    w, h = img.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    img = img.crop((left, top, left + side, top + side)).resize((TARGET, TARGET), Image.LANCZOS)
    img.save(path, "WEBP", quality=82, method=6)


def build_product_cover(raw, slug):
    """Square product photo -> 800x800, cropped only if the source is not square."""
    with Image.open(io.BytesIO(raw)) as img:
        img = img.convert("RGB")
        path = os.path.join(GUIDE_OUT, f"{slug}-800x800.webp")
        save_square(img, path)
    return path


def build_editorial_cover(raw, slug):
    """800x450 editorial photo -> an 800x800 canvas that keeps the whole photo.

    The photo is scaled to the full canvas width and centred; the space above
    and below is a blurred, darkened copy of the same frame. No pixel of the
    subject is cropped away.
    """
    with Image.open(io.BytesIO(raw)) as img:
        img = img.convert("RGB")
        w, h = img.size

        # Background: the same frame, scaled to cover, then blurred and dimmed.
        scale = max(TARGET / w, TARGET / h)
        bg = img.resize((max(TARGET, int(round(w * scale))), max(TARGET, int(round(h * scale)))), Image.LANCZOS)
        bg_w, bg_h = bg.size
        bg = bg.crop(((bg_w - TARGET) // 2, (bg_h - TARGET) // 2, (bg_w - TARGET) // 2 + TARGET, (bg_h - TARGET) // 2 + TARGET))
        bg = bg.filter(ImageFilter.GaussianBlur(radius=18)).convert("RGB")
        bg = Image.blend(bg, Image.new("RGB", bg.size, (12, 16, 24)), 0.45)

        # Foreground: the photo at full canvas width, centred vertically.
        fg_w = TARGET
        fg_h = max(1, int(round(h * (fg_w / w))))
        fg = img.resize((fg_w, fg_h), Image.LANCZOS)

        canvas = bg.copy()
        canvas.paste(fg, (0, (TARGET - fg_h) // 2))
        path = os.path.join(NEWS_OUT, f"{slug}-800x800.webp")
        canvas.save(path, "WEBP", quality=82, method=6)
    return path


def main():
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

    # ---- guides: rebuild from the ORIGINAL square product photo ----
    for g in published:
        slug = str(g.get("slug") or "").strip()
        src = guide_sources.get(slug)
        if not slug or not src:
            failed.append(f"{slug or g.get('id')}: no original source URL")
            continue
        try:
            data = http_get(src)
            path = build_product_cover(data, slug)
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
            path = build_editorial_cover(data, slug)
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
