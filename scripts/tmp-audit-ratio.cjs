const { chromium } = require("playwright");
const BASE = "https://balancebiketoddler.com";
(async () => {
  const b = await chromium.launch({ channel: "chrome" });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  for (const route of ["/guides", "/news", "/guides/beginner/stroller-travel-airplane"]) {
    await p.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await p.waitForTimeout(4000);
    try { const c = p.locator("button:has-text('ACCEPT ALL COOKIES')").first(); if (await c.count()) { await c.click({timeout:3000}); await p.waitForTimeout(500);} } catch {}
    const out = await p.evaluate(() => {
      const res = [];
      for (const img of [...document.querySelectorAll("img")]) {
        const src = img.currentSrc || img.src;
        if (!/store\.balancebiketoddler|balancebiketoddler\.com\/images/.test(src)) continue;
        const r = img.getBoundingClientRect();
        if (r.width < 40 || r.height < 30) continue;
        res.push({
          url: src.split("/").pop().slice(0, 46),
          box: `${Math.round(r.width)}x${Math.round(r.height)}`,
          ratio: (r.width / r.height).toFixed(2),
          fit: getComputedStyle(img).objectFit,
          natural: `${img.naturalWidth}x${img.naturalHeight}`,
        });
      }
      return res.slice(0, 6);
    });
    console.log("==", route);
    for (const o of out) console.log("   ", JSON.stringify(o));
  }
  await b.close();
})().catch((e) => { console.error("FAIL", e.message); process.exit(1); });
