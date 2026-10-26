#!/usr/bin/env python3
"""
audit-tdk.py — 稳定提取 balancebiketoddler.com（及同类预渲染站点）的 TDK。

为什么不需要"WAF 绕过"：
  * 本站在 Cloudflare 后面，但只对【默认/空 User-Agent】返回 403（error 1010）。
    带一个真实浏览器 UA 即可正常 200，无需 JA3 伪造、无需 Turnstile 破解。
  * 本站是 CF Pages 预渲染：静态 HTML 已包含完整 <title>/<meta>，
    普通 HTTP GET 就能拿到，不需要执行 JS。
  * robots.txt 对 Google-Extended / CCBot 是 Allow，合规爬虫不受限。

用法：
  python audit-tdk.py https://balancebiketoddler.com/guides/beginner/balance-bike-size-chart
  python audit-tdk.py --sitemap https://balancebiketoddler.com/sitemap.xml
  python audit-tdk.py URL1 URL2 --hydrate      # 额外用无头浏览器校验水合后 DOM
  python audit-tdk.py URL --json               # 机器可读输出

依赖：核心仅用标准库（urllib / html.parser / urllib.robotparser）。
  --hydrate 需要：pip install playwright && playwright install chromium
"""

import argparse
import json
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import dataclass, asdict
from html.parser import HTMLParser

BROWSER_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


@dataclass
class Tdk:
    url: str
    title: str | None = None
    description: str | None = None
    keywords: str | None = None
    og_title: str | None = None
    og_description: str | None = None
    og_image: str | None = None
    twitter_card: str | None = None
    canonical: str | None = None
    status: int | None = None
    source: str = "static"  # static | hydrated
    error: str | None = None


class MetaExtractor(HTMLParser):
    """零依赖的 <head> 元数据提取器。只关心 meta/title/link[canonical]。"""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title = None
        self._in_title = False
        self._title_buf = []
        self.metas = {}          # name/property -> content （后者覆盖前者，符合浏览器行为）
        self.canonical = None
        self._depth = 0          # 只扫 <head>，遇到 </head> 即停

    def handle_starttag(self, tag, attrs):
        self._depth += 1
        if tag == "head":
            return
        if tag == "title":
            self._in_title = True
            self._title_buf = []
            return
        if tag == "meta":
            d = dict(attrs)
            key = d.get("name") or d.get("property")
            content = d.get("content")
            if key and content is not None:
                self.metas[key.lower()] = content
            return
        if tag == "link":
            d = dict(attrs)
            if d.get("rel", "").lower() == "canonical":
                self.canonical = d.get("href")

    def handle_endtag(self, tag):
        if tag == "head":
            raise StopParsing  # 只扫 head，省算力
        if tag == "title" and self._in_title:
            self._in_title = False
            self.title = "".join(self._title_buf).strip()
        self._depth -= 1

    def handle_data(self, data):
        if self._in_title:
            self._title_buf.append(data)

    def to_tdk(self, url, status):
        return Tdk(
            url=url,
            title=self.title,
            description=self.metas.get("description"),
            keywords=self.metas.get("keywords"),
            og_title=self.metas.get("og:title"),
            og_description=self.metas.get("og:description"),
            og_image=self.metas.get("og:image"),
            twitter_card=self.metas.get("twitter:card"),
            canonical=self.canonical,
            status=status,
            source="static",
        )


class StopParsing(Exception):
    pass


def fetch(url: str, ua: str = BROWSER_UA, timeout: int = 30, retries: int = 3) -> tuple[int, str, str]:
    """跟随重定向（CF Pages 对部分路径发 308），返回 (status, final_url, html)。

    对短暂的网络抖动（连接被重置 / TLS 握手失败 / 超时）做有限重试——
    高并发抓取时 Cloudflare 边缘可能偶发断开连接，重试即可恢复，
    而不是整批崩溃。所有网络异常最终都转成 RuntimeError，由调用方收进 Tdk.error。
    """
    final_url = url
    req = urllib.request.Request(url, headers={"User-Agent": ua, "Accept-Language": "en-US,en;q=0.9"})
    last_err: Exception | None = None
    transient = (urllib.error.URLError, ConnectionError, TimeoutError, OSError, ssl.SSLError)
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                status = resp.status
                final_url = resp.geturl()
                raw = resp.read()
            return status, final_url, raw.decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            # 4xx/5xx 仍可能带 body（如 WAF 拦截页）
            body = ""
            try:
                body = e.read().decode("utf-8", "replace")
            except Exception:
                pass
            return e.code, final_url, body
        except transient as e:
            last_err = e
            if attempt < retries - 1:
                time.sleep(0.5 * (attempt + 1))  # 退避：0.5s, 1.0s
                continue
            reason = getattr(e, "reason", e)
            raise RuntimeError(f"network error for {url}: {reason}") from e
    raise RuntimeError(f"network error for {url}: {last_err}") from last_err


def robots_allows(target: str, ua: str = BROWSER_UA) -> bool | None:
    """用标准库 robotparser 判断 UA 是否被允许。返回 None 表示无法判定（按允许处理）。"""
    from urllib.robotparser import RobotFileParser

    p = urllib.parse.urlparse(target)
    robots_url = f"{p.scheme}://{p.netloc}/robots.txt"
    try:
        rp = RobotFileParser()
        req = urllib.request.Request(robots_url, headers={"User-Agent": ua})
        with urllib.request.urlopen(req, timeout=15) as r:
            rp.parse(r.read().decode("utf-8", "replace").splitlines())
        return rp.can_fetch(ua, target)
    except Exception:
        return None


def extract_static(url: str, ua: str) -> Tdk:
    try:
        status, final_url, html = fetch(url, ua)
    except Exception as e:  # noqa: BLE001 — 任何异常都收进 error 字段，不整批崩溃
        return Tdk(url=url, status=None, error=str(e))
    if status != 200:
        return Tdk(url=url, status=status, error=f"HTTP {status}")
    try:
        parser = MetaExtractor()
        parser.feed(html)
        tdk = parser.to_tdk(final_url, status)
    except StopParsing:
        # head 已扫完，正常结束
        tdk = parser.to_tdk(final_url, status)
    except Exception as e:  # noqa: BLE001
        return Tdk(url=url, status=status, error=f"parse error: {e}")
    return tdk


def extract_hydrated(url: str, ua: str) -> Tdk | None:
    """可选：用 Playwright 跑真实浏览器，读取水合后的 document.title / meta。
    用于发现"静态预渲染 TDK"与"SPA 注水后 TDK"漂移（本项目的常见回归点）。"""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("[hydrate] playwright 未安装，跳过。pip install playwright && playwright install chromium",
              file=sys.stderr)
        return None

    from urllib.request import Request, urlopen
    # 尊重本机代理（沙箱环境常见）
    proxy = None
    try:
        import os
        if os.environ.get("https_proxy"):
            proxy = os.environ["https_proxy"]
    except Exception:
        pass

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, proxy={"server": proxy} if proxy else None)
        ctx = browser.new_context(user_agent=ua)
        page = ctx.new_page()
        page.goto(url, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(1500)  # 给 SPA 注水一点时间
        data = page.evaluate(
            """() => ({
                title: document.title || null,
                description: document.querySelector('meta[name="description" i]')?.getAttribute('content') || null,
                keywords: document.querySelector('meta[name="keywords" i]')?.getAttribute('content') || null,
                ogTitle: document.querySelector('meta[property="og:title" i]')?.getAttribute('content') || null,
                ogDesc: document.querySelector('meta[property="og:description" i]')?.getAttribute('content') || null,
            })"""
        )
        browser.close()

    return Tdk(
        url=url,
        title=data["title"],
        description=data["description"],
        keywords=data["keywords"],
        og_title=data["ogTitle"],
        og_description=data["ogDesc"],
        status=200,
        source="hydrated",
    )


def collect_urls(args) -> list[str]:
    urls: list[str] = list(args.urls)
    if args.sitemap:
        try:
            _, _, xml = fetch(args.sitemap, args.ua)
        except Exception as e:  # noqa: BLE001
            print(f"[sitemap] 抓取失败: {e}", file=sys.stderr)
            return urls
        try:
            root = ET.fromstring(xml)
            # 只收集 <url> 元素的【直接子】<loc>（页面 URL）。
            # 图片 sitemap 扩展把图 URL 放在 <image:image><image:loc> 下，
            # 它们不是 <url> 的直接子节点，因此自然被排除，不会产生 404 噪声。
            for url_el in root.iter():
                if url_el.tag.rsplit("}", 1)[-1] == "url":
                    for child in url_el:
                        if child.tag.rsplit("}", 1)[-1] == "loc" and child.text:
                            urls.append(child.text.strip())
                            break
        except ET.ParseError as e:
            print(f"[sitemap] 解析失败: {e}", file=sys.stderr)
    return urls


def main():
    ap = argparse.ArgumentParser(description="稳定提取站点 TDK（预渲染友好，无需 WAF 绕过）")
    ap.add_argument("urls", nargs="*", help="目标 URL")
    ap.add_argument("--sitemap", help="从 sitemap.xml 收集 URL")
    ap.add_argument("--ua", default=BROWSER_UA, help="请求 UA（默认带真实浏览器 UA 以通过 WAF 1010）")
    ap.add_argument("--hydrate", action="store_true", help="额外用无头浏览器校验水合后 DOM")
    ap.add_argument("--json", action="store_true", help="输出 JSON")
    ap.add_argument("--no-robots", action="store_true", help="跳过 robots.txt 检查")
    ap.add_argument("--workers", type=int, default=1,
                   help="并发抓取线程数（默认 1，顺序；>1 时自动跳过 --hydrate）")
    ap.add_argument("--fail-on-problem", action="store_true",
                   help="发现任何 TDK 问题（抓取失败/非200/缺 title/description/keywords）则退出码 1（用作 CI 守卫）")
    args = ap.parse_args()

    if not args.urls and not args.sitemap:
        ap.error("至少给一个 URL 或 --sitemap")

    urls = collect_urls(args)
    results: list[Tdk] = []

    def process(url: str) -> Tdk:
        if not args.no_robots:
            allowed = robots_allows(url, args.ua)
            if allowed is False:
                return Tdk(url=url, status=None, error="robots.txt disallowed")
        tdk = extract_static(url, args.ua)
        if args.hydrate and tdk.error is None:
            hyd = extract_hydrated(url, args.ua)
            if hyd:
                # 标出漂移：静态与水合不一致
                drift = []
                for field in ("title", "description", "keywords", "og_title", "og_description"):
                    if getattr(tdk, field) != getattr(hyd, field):
                        drift.append(field)
                if drift:
                    tdk.error = f"HYDRATION DRIFT: {','.join(drift)}"
                tdk.source = "static+hydrated"
        return tdk

    workers = max(1, int(args.workers or 1))
    if workers > 1 and not args.hydrate:
        from concurrent.futures import ThreadPoolExecutor, as_completed
        with ThreadPoolExecutor(max_workers=workers) as ex:
            futs = {ex.submit(process, u): u for u in urls}
            for fut in as_completed(futs):
                results.append(fut.result())
        # 保持与 sitemap 相同的 URL 顺序，便于后续 diff
        order = {u: i for i, u in enumerate(urls)}
        results.sort(key=lambda r: order.get(r.url, 1 << 30))
    else:
        for url in urls:
            results.append(process(url))

    if args.fail_on_problem:
        bad = [
            r for r in results
            if r.error or (r.status and r.status != 200) or not r.title or not r.description or not r.keywords
        ]
        if bad:
            print(f"[tdk] {len(bad)}/{len(results)} 页存在 TDK 问题：", file=sys.stderr)
            for r in bad[:50]:
                reasons = []
                if r.error:
                    reasons.append(r.error)
                elif r.status and r.status != 200:
                    reasons.append(f"HTTP {r.status}")
                if not r.title:
                    reasons.append("missing title")
                if not r.description:
                    reasons.append("missing description")
                if not r.keywords:
                    reasons.append("missing keywords")
                print(f"  - {r.url}: {'; '.join(reasons)}", file=sys.stderr)
            sys.exit(1)

    if args.json:
        print(json.dumps([asdict(r) for r in results], ensure_ascii=False, indent=2))
    else:
        for r in results:
            print(f"\n=== {r.url} (status={r.status}, source={r.source}) ===")
            if r.error:
                print(f"  ! {r.error}")
            print(f"  title      : {r.title}")
            print(f"  description: {r.description}")
            print(f"  keywords   : {r.keywords}")
            print(f"  og:title   : {r.og_title}")
            print(f"  og:desc    : {r.og_description}")
            print(f"  og:image   : {r.og_image}")
            print(f"  canonical  : {r.canonical}")


if __name__ == "__main__":
    main()
