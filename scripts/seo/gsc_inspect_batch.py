#!/usr/bin/env python3
"""Batch GSC URL Inspection for balancebiketoddler.com — read-only coverage check.

Reads the submission queue (one URL per line), calls the URL Inspection API
for each URL via the local ADC token (same mechanism as the soundbuttons-cc
precedent script), and writes a coverage report to stdout + a JSON result.

NOTE: the URL Inspection API is READ-ONLY — it reports whether Google has
indexed each URL but cannot itself "request indexing" (no such public API;
the Indexing API is scoped to JobPosting pages only). The output is the
prioritized shortlist for the ~12/day manual submission quota in the GSC UI.

Usage:
  python3 scripts/seo/gsc_inspect_batch.py --queue <file> [--limit N] [--out result.json]
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import subprocess
import sys
import time
import urllib.request
import urllib.error

GSC_ENDPOINT = "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect"
SITE_URL = "sc-domain:balancebiketoddler.com"
QUOTA_PROJECT = "sextant-measure"
PROXY = os.environ.get("GSC_PROXY", "http://127.0.0.1:7890")
TOKEN_REFRESH_EVERY = 350


def adc_token() -> str:
    out = subprocess.check_output(
        ["gcloud", "auth", "application-default", "print-access-token"],
        stderr=subprocess.DEVNULL, text=True, timeout=30,
    ).strip()
    if not out:
        raise SystemExit("ADC token empty — run `gcloud auth application-default login`")
    return out


def make_opener(proxy_enabled: bool) -> urllib.request.OpenerDirector:
    handler = urllib.request.ProxyHandler(
        {"http": PROXY, "https": PROXY} if proxy_enabled else {}
    )
    return urllib.request.build_opener(handler)


def inspect_one(opener, token, url):
    body = json.dumps({
        "inspectionUrl": url,
        "siteUrl": SITE_URL,
        "languageCode": "en",
    }).encode("utf-8")
    req = urllib.request.Request(
        GSC_ENDPOINT, data=body, method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "x-goog-user-project": QUOTA_PROJECT,
        },
    )
    try:
        with opener.open(req, timeout=30) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8")), None
    except urllib.error.HTTPError as e:
        detail = ""
        try:
            detail = e.read().decode("utf-8")[:300]
        except Exception:
            pass
        return e.code, None, f"HTTP {e.code}: {detail}"
    except Exception as e:
        return None, None, str(e)


def verdict(result: dict) -> tuple[str, str]:
    insp = (result.get("inspectionResult") or {})
    idx = (insp.get("indexStatusResult") or {})
    return (
        idx.get("verdict") or "UNKNOWN",
        idx.get("coverageState") or "",
    )


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--queue", required=True)
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--out", default="")
    ap.add_argument("--no-proxy", action="store_true")
    args = ap.parse_args()

    with open(args.queue, encoding="utf-8") as f:
        urls = [ln.strip() for ln in f if ln.strip().startswith("http")]
    if args.limit:
        urls = urls[: args.limit]

    opener = make_opener(not args.no_proxy)
    token = adc_token()
    calls = 0
    results = []
    t0 = time.time()

    for i, url in enumerate(urls, 1):
        if calls and calls % TOKEN_REFRESH_EVERY == 0:
            token = adc_token()
        status, payload, err = inspect_one(opener, token, url)
        calls += 1
        if err:
            results.append({"url": url, "http": status, "error": err})
            print(f"[{i:2}/{len(urls)}] {url}  ERROR {err[:120]}", flush=True)
        else:
            v, cov = verdict(payload)
            crawled = (payload.get("inspectionResult", {})
                       .get("indexStatusResult", {})
                       .get("lastCrawlTime", ""))
            results.append({
                "url": url, "http": status,
                "verdict": v, "coverage": cov, "lastCrawl": crawled,
            })
            print(f"[{i:2}/{len(urls)}] {url}  {v}  {cov}  last={crawled[:10]}", flush=True)
        time.sleep(0.4)

    counts: dict[str, int] = {}
    for r in results:
        counts[r.get("verdict") or f"ERR:{r.get('http')}"] = counts.get(r.get("verdict") or f"ERR:{r.get('http')}", 0) + 1
    print("\n=== SUMMARY ===")
    for k, v in sorted(counts.items()):
        print(f"  {k}: {v}")
    print(f"elapsed: {round(time.time()-t0)}s for {len(urls)} URLs")

    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            json.dump({"generated": dt.datetime.now().isoformat(), "site": SITE_URL,
                       "results": results}, f, ensure_ascii=False, indent=1)
        print(f"saved -> {args.out}")


if __name__ == "__main__":
    main()
