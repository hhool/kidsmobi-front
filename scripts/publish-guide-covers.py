"""
publish-guide-covers.py — turn the CMS guide covers into 16:9 article covers.

Why: the guide cover URLs point at store-hosted Amazon-style paths
(stroller/MAMAZING/Rank_Similar_ASIN_B0FCMTQK6C_MAMAZING%20Ultra%20Air.../images/primary.jpg).
Those are 1500x1500 squares with no keyword in the filename, and they were
being used as og:image / Article image / card artwork. The site already has a
convention for article covers (public/images/news/<slug>-800x450.webp, 16:9),
so every guide gets the same treatment: a centre-cropped 800x450 WebP under
public/images/guides/<slug>-800x450.webp.

The CMS imageUrl is repointed at the new root-relative path in a second pass
(the static build resolves /images/... against the site origin, exactly like
the news covers).

Usage:
  python publish-guide-covers.py            # download + build files only
  python publish-guide-covers.py --write    # also patch imageUrl in the CMS
"""

import io
import json
import os
import sys
import urllib.request

from PIL import Image

API_BASE = "https://store.balancebiketoddler.com"
OUT_DIR = os.path.join("public", "images", "guides")
TARGET = (800, 450)  # 16:9, same canvas as the news covers


def http_get(url, token=None, timeout=60, attempts=3):
    last = None
    for attempt in range(attempts):
        try:
            req = urllib.request.Request(url)
            if token:
                req.add_header("x-cms-admin-token", token)
            req.add_header("user-agent", "kidsmobi-covers/1.0")
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.read()
        except Exception as exc:  # noqa: BLE001
            last = exc
            print(f"    retry {attempt + 1}/{attempts} for {url[-40:]}: {exc}")
    raise last


def cover_filename(slug):
    return f"{slug}-800x450.webp"


def build_cover(raw, slug):
    """Centre-crop to 16:9 and resize to 800x450."""
    with Image.open(io.BytesIO(raw)) as img:
        img = img.convert("RGB")
        w, h = img.size
        target_ratio = TARGET[0] / TARGET[1]
        if w / h > target_ratio:
            # too wide -> crop the sides
            new_w = int(round(h * target_ratio))
            left = (w - new_w) // 2
            img = img.crop((left, 0, left + new_w, h))
        else:
            # too tall (the 1500x1500 product shots) -> crop top and bottom
            new_h = int(round(w / target_ratio))
            top = (h - new_h) // 2
            img = img.crop((0, top, w, top + new_h))
        img = img.resize(TARGET, Image.LANCZOS)
        path = os.path.join(OUT_DIR, cover_filename(slug))
        img.save(path, "WEBP", quality=82, method=6)
    return path


def main():
    token = os.environ.get("CMS_ADMIN_ALL_TOKEN", "")
    write = "--write" in sys.argv
    if not token:
        print("CMS_ADMIN_ALL_TOKEN is required")
        return 1

    os.makedirs(OUT_DIR, exist_ok=True)

    raw = http_get(f"{API_BASE}/api/cms/ops/export", token=token)
    guides = json.loads(raw)["data"]["collections"]["guides"]
    published = [g for g in guides if str(g.get("status", "")).lower() == "published"]
    print(f"published guides: {len(published)}")

    built, failed = 0, []
    for g in published:
        slug = str(g.get("slug") or "").strip()
        src = str(g.get("imageUrl") or "").strip()
        if not slug or not src:
            failed.append(f"{slug or g.get('id')}: no slug/image")
            continue
        try:
            data = http_get(src)
            path = build_cover(data, slug)
            size = os.path.getsize(path)
            print(f"  {os.path.basename(path)}  {size/1024:.0f}KB  <- {src[:70]}")
            built += 1
        except Exception as exc:  # noqa: BLE001
            failed.append(f"{slug}: {exc}")

    print(f"\nbuilt: {built}/{len(published)}")
    if failed:
        print("FAILED:")
        for f in failed:
            print("  -", f)
        return 1

    if not write:
        print("\nDry run. Re-run with --write to repoint imageUrl in the CMS.")
        return 0

    # Second pass: repoint the CMS records at the new local covers.
    updated = 0
    for g in published:
        slug = str(g.get("slug") or "").strip()
        new_path = f"/images/guides/{cover_filename(slug)}"
        if str(g.get("imageUrl") or "").strip() == new_path:
            continue
        payload = dict(g)
        payload["imageUrl"] = new_path
        req = urllib.request.Request(
            f"{API_BASE}/api/cms/guides/save",
            data=json.dumps(payload).encode("utf-8"),
            method="POST",
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json",
                "x-cms-admin-token": token,
                # Cloudflare WAF error 1010 blocks the default urllib signature,
                # so every request must carry an explicit User-Agent.
                "User-Agent": "kidsmobi-covers/1.0",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                if resp.status == 200:
                    updated += 1
                else:
                    failed.append(f"{slug}: HTTP {resp.status}")
        except Exception as exc:  # noqa: BLE001
            failed.append(f"{slug}: {exc}")
    print(f"imageUrl updated: {updated}/{len(published)}")
    if failed:
        print("FAILED:")
        for f in failed:
            print("  -", f)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
