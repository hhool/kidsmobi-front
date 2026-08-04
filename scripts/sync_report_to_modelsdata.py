#!/usr/bin/env python3
"""
sync_report_to_modelsdata.py
Batch-enriches modelsData.ts with:
  - customers_say (from report)
  - editorVerdict (1-sentence, generated from report)
  - galleryUrls (alt_1..alt_9 + primary)
  - featureImageUrls (manufacturer aplus images)
Only patches records where the field is missing / placeholder.
"""

import json, re, os, urllib.parse

STORE_BASE = "https://store.balancebiketoddler.com"
MODELS_FILE = "src/data/modelsData.ts"
API_DATA_DIR = "../backend/.deploy/worker-api-data/api-data"

CATEGORIES = {
    "balance_bike":      ("balance_bike_report.json",    "balance_bike"),
    "car_seat":          ("car_seat_report.json",         "car_seat"),
    "electric_vehicles": ("electric_vehicles_report.json","electric_vehicles"),
    "kids_bikes":        ("kids_bikes_report.json",       "kids_bikes"),
    "scooters":          ("scooters_report.json",         "scooters"),
    "stroller":          ("strollers_report.json",        "stroller"),
}

PLACEHOLDER_PATTERNS = [
    "pending editorial enrichment", "please enrich", "backend preview",
    "backend-imported", "needs editorial", "auto-generated verdict",
    "(features[", "product_description", "product_specifications",
]

# Patterns that indicate raw text being misused as verdict
RAW_DESCRIPTION_SIGNALS = [
    "glow wheel:", "design for kids", "sporty design:", "specifically for kids:",
    "safe and reliable", "riding comfort", "this keeps the", "parent's tip:",
    "features[", "product_description", "👶", "🚴", "【", "】",
    "variable speeds", "robust & safe", "our mountain bike",
]

def is_placeholder_verdict(text):
    if not text or len(text) < 20:
        return True
    t = text.lower()
    if any(p in t for p in PLACEHOLDER_PATTERNS):
        return True
    if any(p in t for p in RAW_DESCRIPTION_SIGNALS):
        return True
    # Raw description text: doesn't end properly or is >400 chars (too long for 1-sentence)
    if len(text) > 380:
        return True
    return False

def local_path_to_store_url(local_path):
    """Convert scrape_store/... path to store.balancebiketoddler.com URL."""
    p = str(local_path or "").strip()
    if not p:
        return ""
    # Remove scrape_store/ prefix
    p = re.sub(r'^scrape_store/', '', p)
    # URL-encode each path segment (space → %20, etc.)
    parts = p.split("/")
    encoded = "/".join(urllib.parse.quote(seg, safe="") for seg in parts)
    return f"{STORE_BASE}/{encoded}"

def clean_sentence(text, max_len=220):
    """Trim to first sentence or max_len chars."""
    text = re.sub(r'\s+', ' ', str(text or "")).strip()
    # Remove source tags like (Features[1])
    text = re.sub(r'\s*\(Features\[\d+\]\)\s*', ' ', text)
    text = re.sub(r'\s*\(Product_Description\)\s*', ' ', text)
    text = re.sub(r"\bThis keeps the ride\b.+", "", text).strip()
    text = re.sub(r"\bParent's Tip:\s*", "", text).strip()
    # First sentence
    m = re.search(r'^(.+?[.!?])(?:\s|$)', text)
    if m and len(m.group(1)) >= 40:
        return m.group(1).strip()
    return text[:max_len].strip()

def build_verdict(product):
    """Generate a 1-sentence editorVerdict from report data."""
    brand = product.get("Brand", "")
    title = product.get("Title", "")
    features_raw = product.get("Features", "")
    customers_say = product.get("customers_say", "")
    
    # Parse features
    features = [f.strip() for f in features_raw.split("|") if f.strip()] if "|" in features_raw else [features_raw]
    
    # Try expert comment seeds first
    seeds = product.get("Expert_Review_Inputs", {}).get("expertCommentSeeds", [])
    safety_seed = next((s.get("seed","") for s in seeds if "safety" in s.get("section","").lower()), "")
    
    # Build verdict from best available source
    base = ""
    if safety_seed and len(clean_sentence(safety_seed)) > 50:
        base = clean_sentence(safety_seed)
    elif features and len(features[0]) > 40:
        base = clean_sentence(features[0])
    elif customers_say:
        # Extract positive part
        pos_m = re.search(r'^Customers find.+?(?=[Hh]owever|[Tt]he\s+\w+\s+receive|$)', customers_say)
        base = clean_sentence(pos_m.group(0) if pos_m else customers_say)
    
    if not base:
        return ""
    
    # Extract concern from customers_say
    concern = ""
    if customers_say:
        c_m = re.search(r'[Hh]owever,?\s+(.+?[.!?])(?:\s|$)', customers_say)
        if c_m:
            concern_raw = c_m.group(1).strip()
            if 20 < len(concern_raw) < 120:
                concern = concern_raw.rstrip(".")
    
    verdict = base.rstrip(".")
    if concern:
        verdict = f"{verdict} — caution: {concern.lower()}."
    else:
        verdict += "."
    
    return verdict[:280]

def build_gallery_urls(product):
    """Build gallery URL list from Local_Image_Paths."""
    paths = product.get("Local_Image_Paths", [])
    if not paths:
        lp = product.get("Local_Image_Path", "")
        if lp:
            paths = [lp]
    urls = []
    primary_url = ""
    alt_urls = []
    for p in paths:
        url = local_path_to_store_url(p)
        if not url:
            continue
        if "primary" in p.lower():
            primary_url = url
        else:
            alt_urls.append(url)
    return primary_url, alt_urls

def build_feature_image_urls(product):
    """Build manufacturer feature image URLs from Local_Images in Assets."""
    assets = product.get("From_The_Manufacturer", {}).get("Assets", {})
    local_images = assets.get("Local_Images", [])
    return [local_path_to_store_url(p) for p in local_images if p]

def js_escape(s):
    """Escape for JS string literal."""
    return s.replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ").replace("\r", "")

def patch_modelsdata(lines, product_id, product, stats):
    """Find the product block and patch missing fields. Returns modified lines."""
    # Find start line
    search = f'"id": "{product_id}"'
    start_idx = None
    for i, line in enumerate(lines):
        if search in line:
            start_idx = i
            break
    if start_idx is None:
        stats["not_found"] += 1
        return lines

    # Find end of this product block (next top-level `{` after `,`)
    end_idx = len(lines)
    depth = 0
    block_started = False
    for i in range(start_idx - 3, len(lines)):
        for ch in lines[i]:
            if ch == '{':
                depth += 1
                block_started = True
            elif ch == '}':
                depth -= 1
        if block_started and depth == 0:
            end_idx = i + 1
            break

    block = "".join(lines[start_idx:end_idx])

    # Check what needs patching
    need_verdict = is_placeholder_verdict(_extract_field(block, "editorVerdict"))
    has_customers_say = bool(_extract_field(block, "customers_say"))
    
    gallery_match = re.search(r'"galleryUrls":\s*\[([^\]]+)\]', block, re.DOTALL)
    gallery_count = len(re.findall(r'https://', gallery_match.group(1))) if gallery_match else 0
    
    has_feature_imgs = '"featureImageUrls"' in block

    anything_changed = False

    # 1. Patch editorVerdict
    if need_verdict:
        verdict = build_verdict(product)
        if verdict:
            escaped = js_escape(verdict)
            # Use lambda to avoid backslash interpretation in replacement string
            new_block = re.sub(
                r'("editorVerdict":\s*")[^"]*(")',
                lambda m: m.group(1) + escaped + m.group(2),
                block
            )
            if new_block != block:
                block = new_block
                stats["verdict_updated"] += 1
                anything_changed = True

    # 2. Patch customers_say
    if not has_customers_say:
        cs = product.get("customers_say", "")
        if cs:
            escaped_cs = js_escape(cs)
            # Insert customers_say before scrapedEvidence or scoringStandards or pros
            insert_after = '"editorVerdict"'
            for marker in ['"scrapedEvidence"', '"scoringStandards"', '"pros"']:
                if marker in block:
                    insert_after = marker
                    break
            block = block.replace(
                insert_after,
                f'"customers_say": "{escaped_cs}",\n    {insert_after}',
                1
            )
            stats["customers_say_added"] += 1
            anything_changed = True

    # 3. Patch galleryUrls
    if gallery_count <= 1:
        primary_url, alt_urls = build_gallery_urls(product)
        if alt_urls:
            url_lines = ",\n      ".join(f'"{u}"' for u in alt_urls)
            
            if gallery_count == 1:
                # Replace existing single-entry galleryUrls
                new_block = re.sub(
                    r'("galleryUrls":\s*\[)[^\]]*(\])',
                    lambda m: m.group(1) + "\n      " + url_lines + "\n    " + m.group(2),
                    block
                )
            else:
                # No galleryUrls - insert after imageUrl
                if primary_url:
                    new_urls = primary_url + '",\n      "' + '",\n      "'.join(alt_urls)
                else:
                    new_urls = '",\n      "'.join(alt_urls)
                new_block = block.replace(
                    '"imageUrl"',
                    f'"galleryUrls": [\n      "{new_urls}"\n    ],\n    "imageUrl"',
                    1
                )
            
            if new_block != block:
                block = new_block
                stats["gallery_updated"] += 1
                anything_changed = True

    # 4. Patch featureImageUrls
    if not has_feature_imgs:
        feature_urls = build_feature_image_urls(product)
        if feature_urls:
            url_lines = ",\n      ".join(f'"{u}"' for u in feature_urls)
            # Insert after galleryUrls
            if '"galleryUrls"' in block:
                # Find end of galleryUrls array
                block = re.sub(
                    r'("galleryUrls":\s*\[[^\]]+\])(,)',
                    f'\\1,\n    "featureImageUrls": [\n      {url_lines}\n    ]',
                    block,
                    count=1
                )
                # Check if it actually changed (the replacement above may fail if there's no comma)
                if '"featureImageUrls"' in block:
                    stats["feature_imgs_added"] += 1
                    anything_changed = True

    if anything_changed:
        stats["total_patched"] += 1
        # Replace the lines in the original file
        new_block_lines = block.splitlines(keepends=True)
        lines = lines[:start_idx] + new_block_lines + lines[end_idx:]

    return lines

def _extract_field(block, field_name):
    m = re.search(rf'"{re.escape(field_name)}":\s*"([^"]*)"', block)
    return m.group(1) if m else ""

def main():
    print(f"Reading {MODELS_FILE}...")
    with open(MODELS_FILE, "r", encoding="utf-8") as f:
        content = f.read()
    lines = content.splitlines(keepends=True)
    
    total_stats = {
        "total_patched": 0,
        "verdict_updated": 0,
        "customers_say_added": 0,
        "gallery_updated": 0,
        "feature_imgs_added": 0,
        "not_found": 0,
    }

    for cat_key, (report_file, id_prefix) in CATEGORIES.items():
        report_path = os.path.join(API_DATA_DIR, cat_key, report_file)
        if not os.path.exists(report_path):
            print(f"  SKIP: {report_path} not found")
            continue
        
        with open(report_path, "r", encoding="utf-8") as f:
            report = json.load(f)
        
        print(f"\n[{cat_key}] {len(report)} records")
        cat_stats = {k: 0 for k in total_stats}

        for product in report:
            asin = str(product.get("ASIN", "")).lower()
            if not asin:
                continue
            product_id = f"{id_prefix}-{asin}"
            lines = patch_modelsdata(lines, product_id, product, cat_stats)

        for k in total_stats:
            total_stats[k] += cat_stats[k]
        
        print(f"  patched:{cat_stats['total_patched']}  verdict:{cat_stats['verdict_updated']}  "
              f"customers_say:{cat_stats['customers_say_added']}  "
              f"gallery:{cat_stats['gallery_updated']}  "
              f"feature_imgs:{cat_stats['feature_imgs_added']}  "
              f"not_found:{cat_stats['not_found']}")

    print(f"\n{'='*50}")
    print(f"TOTAL patched: {total_stats['total_patched']}")
    print(f"  editorVerdict updated: {total_stats['verdict_updated']}")
    print(f"  customers_say added:   {total_stats['customers_say_added']}")
    print(f"  gallery updated:       {total_stats['gallery_updated']}")
    print(f"  feature_imgs added:    {total_stats['feature_imgs_added']}")
    print(f"  not_found:             {total_stats['not_found']}")

    print(f"\nWriting {MODELS_FILE}...")
    with open(MODELS_FILE, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print("Done.")

if __name__ == "__main__":
    main()
