const { chromium } = require("playwright");
const BASE = "https://balancebiketoddler.com";
(async () => {
  const b = await chromium.launch({ channel: "chrome" });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  p.on("pageerror", (e) => errors.push(String(e.message).slice(0, 100)));

  for (const [route, label] of [["/zh/guides", "zh hub"], ["/zh/news", "zh news hub"], ["/zh/guides/beginner/stroller-travel-airplane", "zh detail"]]) {
    await p.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await p.waitForTimeout(4000);
    try { const c = p.locator("button:has-text('ACCEPT ALL COOKIES')").first(); if (await c.count()) { await c.click({timeout:3000}); await p.waitForTimeout(600);} } catch {}
    const info = await p.evaluate(() => ({
      path: window.location.pathname,
      h1: document.querySelector("h1")?.textContent?.trim().slice(0, 34) || "",
      title: document.title.slice(0, 46),
      canonical: document.querySelector("link[rel='canonical']")?.getAttribute("href") || "",
      lang: document.documentElement.lang,
      hreflang: [...new Set([...document.querySelectorAll("link[rel='alternate']")].map((l) => `${l.getAttribute("hreflang")}`))].join(","),
    }));
    console.log(label + ":", JSON.stringify(info));
  }

  // language toggle on a Chinese page must land on the English twin
  await p.goto(`${BASE}/zh/guides`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await p.waitForTimeout(3500);
  const btns = await p.locator("button").allTextContents();
  const globe = p.locator("button:has(svg)").filter({ hasText: "" });
  // the language button carries a title attribute
  await p.setViewportSize({ width: 1280, height: 900 });
  await p.waitForTimeout(500);
  const langBtn = p.locator("button[title*='English'], button[title*='中文']").first();
  if (await langBtn.count()) {
    console.log("toggle title:", await langBtn.getAttribute("title"));
    await langBtn.click({ timeout: 5000 });
    await p.waitForTimeout(2500);
    console.log("after toggle -> path:", await p.evaluate(() => window.location.pathname), "| title:", await p.title());
  } else {
    console.log("toggle button not found; button titles:", JSON.stringify(await p.locator("button[title]").evaluateAll((els) => els.map((e) => e.getAttribute("title")).slice(0, 6))));
  }
  console.log("pageerrors:", errors);
  await b.close();
})().catch((e) => { console.error("FAIL", e.message); process.exit(1); });
