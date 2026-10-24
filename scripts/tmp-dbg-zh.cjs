const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch({ channel: "chrome" });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto("https://balancebiketoddler.com/zh/guides", { waitUntil: "domcontentloaded", timeout: 90000 });
  await p.waitForTimeout(4500);
  const info = await p.evaluate(() => ({
    pathname: window.location.pathname,
    htmlLang: document.documentElement.lang,
    storedLang: window.localStorage.getItem("app_lang"),
    h1s: [...document.querySelectorAll("h1")].map((h) => (h.textContent || "").trim().slice(0, 40)),
    canonical: document.querySelector("link[rel='canonical']")?.getAttribute("href"),
    title: document.title,
  }));
  console.log(JSON.stringify(info, null, 1));
  await b.close();
})().catch((e) => { console.error("FAIL", e.message); process.exit(1); });
