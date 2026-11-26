"""
build-evaluation-covers.py — give the two orphan-ASIN reviews a cover.

Why they had none:
  `/reviews` cards resolve their artwork from the review's LINKED PRODUCT
  (`resolveProductByReference`), and these two evaluations reference ASINs
  (B0G5KD8BTZ, B0BDRKG478) that have no products record. With no product the
  card renders no image — and the SPA drops the card entirely. The
  evaluations' own `imageUrl` was empty, so the prerender's fallback had
  nothing to fall back to either.

Why a site-owned cover and not a products record:
  Adding a products record would publish a product DETAIL page, and those
  require measured specs, scores and pros/cons. Inventing them to satisfy a
  card image would trade one visible gap for a fabricated page. A cover only
  needs the photograph.

The rule this reuses:
  publish-article-covers.py already owns the "never crop" composer: the
  source's long side fills an 800x800 canvas and the short-axis remainder is
  filled with a reflection of the picture's own edge. Reusing it keeps these
  covers geometrically identical to the 65 covers already shipping, so the
  existing CI guard (check:covergeometry, "the picture region must have the
  SAME aspect ratio as the source") covers them too instead of a second,
  weaker rule growing beside it.

Outputs:
  public/images/evaluations/<slug>-800x800.webp
  geometry appended to scripts/article-cover-geometry.json
  source URLs recorded in scripts/article-cover-sources.json

Usage:
  python build-evaluation-covers.py
"""

import io
import json
import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from importlib import import_module

publisher = import_module("publish-article-covers")

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(REPO_ROOT, "public", "images", "evaluations")
SOURCE_MAP = os.path.join(REPO_ROOT, "scripts", "article-cover-sources.json")
GEOMETRY_MANIFEST = os.path.join(REPO_ROOT, "scripts", "article-cover-geometry.json")

# Storage slug -> (source URL or local path, where the bytes came from).
#
# B0G5KD8BTZ is a variant ASIN of B0FWKK3JXX: the main image Amazon serves for
# the variant is BYTE-IDENTICAL (md5 778999edc519ab811ed3e0d3d8fbfae0) to
# images/alt_9.jpg already hosted for the reviewed product, so the source is
# that hosted file rather than a fresh re-host of the same bytes.
#
# B0BDRKG478 (Graco TurboBooster 2.0) has no hosted copy anywhere in the media
# bucket, so its source is the publisher's own download of the product photo.
SOURCES = {
    "eval-single-electric-vehicles-b0g5kd8btz": {
        "source": "https://store.balancebiketoddler.com/electric_vehicles/First/"
        "Rank_5_ASIN_B0FWKK3JXX_First%20Ride%20On%2036V%20Kids%20Ride%20On%20UTV%202-Seater%20400W%20E/"
        "images/alt_9.jpg",
        "local": None,
        "note": "variant ASIN of B0FWKK3JXX; byte-identical hosted alt_9.jpg",
    },
    "eval-single-car-seat-b0bdrkg478": {
        "source": None,
        "local": os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            "evaluation-cover-originals",
            "graco-turbobooster-2.0-b0bdrkg478.jpg",
        ),
        "note": "Graco TurboBooster 2.0 product photo, 1500x1500",
    },
}


def read_bytes(entry):
    if entry.get("local"):
        with open(entry["local"], "rb") as fh:
            return fh.read()
    return publisher.http_get(entry["source"])


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    built, failed = 0, []
    geometry = {}
    recorded_sources = {}

    for slug, entry in SOURCES.items():
        try:
            raw = read_bytes(entry)
            with Image.open(io.BytesIO(raw)) as img:
                img = img.convert("RGB")
                source_size = img.size
                canvas, meta = publisher.compose_square(img)
            path = os.path.join(OUT_DIR, f"{slug}-800x800.webp")
            canvas.save(path, "WEBP", quality=82, method=6)
            meta["out"] = os.path.relpath(path, REPO_ROOT).replace(os.sep, "/")
            geometry[slug] = meta
            recorded_sources[slug] = entry.get("source") or os.path.relpath(
                entry["local"], REPO_ROOT
            ).replace(os.sep, "/")
            print(
                f"  {os.path.basename(path)}  {os.path.getsize(path)/1024:.0f}KB  "
                f"source {source_size[0]}x{source_size[1]} -> picture {meta['inner'][0]}x{meta['inner'][1]} "
                f"at {meta['offset'][0]},{meta['offset'][1]}"
            )
            built += 1
        except Exception as exc:  # noqa: BLE001
            failed.append(f"{slug}: {exc}")

    print(f"\nbuilt: {built}/{len(SOURCES)}")
    if failed:
        for f in failed:
            print("  -", f)
        return 1

    # Merge into the shared ledgers.
    publisher.write_geometry_manifest(geometry)

    with open(SOURCE_MAP, encoding="utf-8") as fh:
        sources = json.load(fh)
    sources.setdefault("evaluations", {}).update(recorded_sources)
    with open(SOURCE_MAP, "w", encoding="utf-8") as fh:
        json.dump(sources, fh, indent=2, sort_keys=True)
        fh.write("\n")

    print(f"geometry covers: {len(json.load(open(GEOMETRY_MANIFEST))['covers'])}")
    print(f"sources.evaluations: {len(sources['evaluations'])}")
    return 0


if __name__ == "__main__":
    sys.exit(main())