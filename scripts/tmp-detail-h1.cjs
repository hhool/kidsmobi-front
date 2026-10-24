const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch({ channel: "chrome" });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  for (const route of ["/guides/beginner/stroller-travel-airplane", "/zh/guides/beginner/stroller-travel-airplane"]) {
    await p.goto(`https://balancebiketoddler.com${route}`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await p.waitForTimeout(4500);
    const info = await p.evaluate(() => ({
      path: window.location.pathname,
      h1s: [...document.querySelectorAll("h1")].map((h) => (h.textContent || "").trim().slice(0, 46)),
      firstPara: (document.querySelector("main p")?.textContent || "").trim().slice(0, 60),
      title: document.title.slice(0, 44),
    }));
    console.log(route, "->", JSON.stringify(info));
  }
  await b.close();
})().catch((e) => { console.error("FAIL", e.message); process.exit(1); });
